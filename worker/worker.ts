import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    "https://anxhpmvpzlvlkylttzub.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFueGhwbXZwemx2bGt5bHR0enViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTA2MjMsImV4cCI6MjA2MzYyNjYyM30.ngKFH2gRAaIcoJn2fz7wnOTxEV8xT_RONUw225ZJNsw"
);

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "AI Task Manager",
  },
});

interface Message {
    id: string;
    content: string;
    created_at: string;
    embedding?: number[];
    sender_id: string;  
    receiver_id: string;
}

interface TaskExtraction {
  task: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  description: string;
  due_date: string | null;
  action: 'create' | 'update' | 'complete' | 'cancel';
  existing_task_reference?: string;
  matched_task_id?: string; 
  update_fields?: string[];
}

interface EmbeddingContext {
  content: string;
  similarity?: number;
  timestamp?: string;
}

interface Task {
  id?: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  description: string;
  message_id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  due_date?: string | null;
  completed_at?: string | null;
}

interface TaskSimilarity {
  task: Task;
  similarity: number;
  reasons: string[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

async function findSimilarMessages(
  currentEmbedding: number[], 
  senderId: string, 
  receiverId: string,
  limit: number = 10
): Promise<EmbeddingContext[]> {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('content, embedding, created_at')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .not('embedding', 'is', null)
      .limit(100); 

    if (error || !messages) {
      console.error('Error fetching messages for similarity:', error);
      return [];
    }

    const similarities = messages.map(msg => {
      if (!msg.embedding || !Array.isArray(msg.embedding)) return null;
      
      const similarity = cosineSimilarity(currentEmbedding, msg.embedding);
      return {
        content: msg.content,
        similarity,
        timestamp: msg.created_at
      };
    }).filter(Boolean) as EmbeddingContext[];

    return similarities
      .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
      .slice(0, limit);
      
  } catch (error) {
    console.error('Error finding similar messages:', error);
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function findRecentTasks(
  senderId: string, 
  receiverId: string,
  limit: number = 20
): Promise<Task[]> {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
      .in('status', ['pending', 'completed']) 
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent tasks:', error);
      return [];
    }

    return tasks || [];
  } catch (error) {
    console.error('Error finding recent tasks:', error);
    return [];
  }
}

async function findRelevantTasks(
  messageContent: string,
  messageEmbedding: number[],
  recentTasks: Task[]
): Promise<TaskSimilarity[]> {
  try {
    const taskSimilarities: TaskSimilarity[] = [];

    for (const task of recentTasks) {
      const taskEmbedding = await generateEmbedding(task.content + ' ' + task.description);
      const similarity = cosineSimilarity(messageEmbedding, taskEmbedding);
      
      const reasons = [];
      
      if (similarity > 0.7) reasons.push(`High semantic similarity (${(similarity * 100).toFixed(1)}%)`);
      
      const messageWords = messageContent.toLowerCase().split(/\s+/);
      const taskWords = (task.content + ' ' + task.description).toLowerCase().split(/\s+/);
      const commonWords = messageWords.filter(word => 
        word.length > 3 && taskWords.some(taskWord => taskWord.includes(word) || word.includes(taskWord))
      );
      if (commonWords.length > 0) reasons.push(`Common keywords: ${commonWords.join(', ')}`);
      
      const referencePatterns = [
        /that task/i, /the task/i, /this task/i, /it/i, /that one/i,
        /update/i, /change/i, /modify/i, /edit/i, /revise/i,
        /done/i, /finished/i, /completed/i, /complete/i,
        /cancel/i, /remove/i, /delete/i, /forget/i
      ];
      
      const hasReference = referencePatterns.some(pattern => pattern.test(messageContent));
      if (hasReference) reasons.push('Contains task reference indicators');

      const taskAge = Date.now() - new Date(task.created_at).getTime();
      const daysSinceCreated = taskAge / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 1) reasons.push('Very recent task (< 1 day)');
      else if (daysSinceCreated < 3) reasons.push('Recent task (< 3 days)');

      if (similarity > 0.5 || reasons.length > 1) {
        taskSimilarities.push({
          task,
          similarity,
          reasons
        });
      }
    }

    return taskSimilarities.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Error finding relevant tasks:', error);
    return [];
  }
}

async function extractTaskFromEmbeddings(
  currentMessage: string,
  similarMessages: EmbeddingContext[] = [],
  recentTasks: Task[] = [],
  relevantTasks: TaskSimilarity[] = []
): Promise<TaskExtraction | null> {
  try {
    const contextString = similarMessages.length > 0 
      ? similarMessages.map((msg, i) => 
          `Context ${i + 1} (similarity: ${msg.similarity?.toFixed(2) || 'N/A'}): "${msg.content}"`
        ).join('\n')
      : "No similar context available.";

    const tasksContext = recentTasks.length > 0
      ? recentTasks.map((task, i) => 
          `Task ${i + 1} (ID: ${task.id}): "${task.content}" - Priority: ${task.priority}, Status: ${task.status}, Due: ${task.due_date || 'No deadline'}, Created: ${task.created_at}`
        ).join('\n')
      : "No recent tasks found.";

    const relevantTasksContext = relevantTasks.length > 0
      ? relevantTasks.map((item, i) => 
          `Relevant Task ${i + 1} (ID: ${item.task.id}, Similarity: ${(item.similarity * 100).toFixed(1)}%):
           Content: "${item.task.content}"
           Priority: ${item.task.priority}, Status: ${item.task.status}
           Due: ${item.task.due_date || 'No deadline'}
           Reasons: ${item.reasons.join(', ')}`
        ).join('\n\n')
      : "No relevant tasks found for potential updates.";

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleString();

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-8b-instruct:free",
      messages: [
        {
          role: "system",
          content: `You are an intelligent task management AI. Analyze messages to determine the correct action: CREATE, UPDATE, COMPLETE, or CANCEL tasks.

CURRENT DATE/TIME: ${currentTime}
TODAY'S DATE: ${currentDate}

ENHANCED UPDATE DETECTION:
You have access to existing tasks with similarity scores and relevance reasons. Use this information to:
1. Identify when a message is referring to an existing task
2. Determine what aspects of the task should be updated
3. Provide the exact task ID for updates

UPDATE SIGNALS (look for these patterns):
- Direct references: "that task", "the report task", "it", "this"
- Update keywords: "change to", "make it", "update", "modify", "revise", "adjust"
- Deadline changes: "move to tomorrow", "extend deadline", "due next week instead"
- Priority changes: "make it urgent", "lower priority", "not that important"
- Status changes: "done", "finished", "completed", "cancel it", "forget about it"
- Content modifications: "actually let's do X instead", "add Y to the task"

COMPLETION SIGNALS:
- "done with", "finished", "completed", "task is ready", "all set"
- "submitted the", "sent the", "delivered the"

CANCELLATION SIGNALS:
- "cancel", "forget about", "not needed anymore", "remove", "delete"

PRIORITY LEVELS:
- urgent: Critical, immediate action needed
- high: Important, deadline within 24-48 hours  
- medium: Moderate importance, can wait a few days
- low: Nice to have, no strict deadline

When analyzing, pay special attention to:
1. Semantic similarity scores (>70% likely refers to existing task)
2. Common keywords between message and existing tasks
3. Task reference indicators in the message
4. Recency of tasks (newer tasks more likely to be referenced)

RESPONSE FORMAT (JSON only):
{
  "task": "task content (new or updated)",
  "priority": "low|medium|high|urgent",
  "confidence": 0.0-1.0,
  "description": "what this action does",
  "due_date": "YYYY-MM-DD or null",
  "action": "create|update|complete|cancel",
  "existing_task_reference": "description of referenced task",
  "matched_task_id": "exact task ID if updating/completing/canceling",
  "update_fields": ["content", "priority", "due_date", "status"] // which fields to update
}`
        },
        {
          role: "user",
          content: `CURRENT MESSAGE: "${currentMessage}"

CONVERSATION CONTEXT:
${contextString}

ALL RECENT TASKS:
${tasksContext}

MOST RELEVANT TASKS FOR POTENTIAL UPDATES:
${relevantTasksContext}

Analyze the message and determine the appropriate action. If updating an existing task, use the matched_task_id from the relevant tasks. Pay close attention to the similarity scores and reasons provided. Respond with JSON only.`
        }
      ],
      temperature: 0.2,
      max_tokens: 600
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(response.trim()) as TaskExtraction;
    
    if (parsed.action === 'create' && (!parsed.task || parsed.task === 'null' || parsed.task.toLowerCase() === 'null')) {
      return null;
    }

    if (['update', 'complete', 'cancel'].includes(parsed.action) && !parsed.matched_task_id && relevantTasks.length > 0) {
    
      parsed.matched_task_id = relevantTasks[0].task.id;
      console.log(`Auto-matched task ID: ${parsed.matched_task_id} for action: ${parsed.action}`);
    }

    return parsed;

  } catch (error) {
    console.error('Error extracting task:', error);
    return null;
  }
}

async function updateExistingTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
  try {
    const updateData: Partial<Task> & { updated_at: string } = {
      ...updates,
      updated_at: getCurrentDateTime()
    };

    if (updates.status === 'completed') {
      updateData.completed_at = getCurrentDateTime();
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      return false;
    }

    console.log('Task updated successfully:', {
      taskId,
      updates: updateData
    });
    return true;
  } catch (error) {
    console.error('Error updating task:', error);
    return false;
  }
}

async function saveTask(task: Task): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tasks')
      .insert([task]);

    if (error) {
      console.error('Error saving task:', error);
      return false;
    }

    console.log('Task saved successfully:', {
      content: task.content,
      priority: task.priority,
      due_date: task.due_date,
      created_at: task.created_at
    });
    return true;
  } catch (error) {
    console.error('Error saving task:', error);
    return false;
  }
}

async function processMessage(message: Message) {
    try {
        console.log('Processing message:', message.id, message.content.substring(0, 50) + '...');
        
        // Generate embedding if not exists
        let embedding = message.embedding;
        if (!embedding || embedding.length === 0) {
            console.log('Generating embedding for message...');
            embedding = await generateEmbedding(message.content);
            
            if (embedding.length > 0) {
                await supabase
                    .from('messages')
                    .update({ embedding })
                    .eq('id', message.id);
            }
        }

        const similarMessages = await findSimilarMessages(
            embedding, 
            message.sender_id, 
            message.receiver_id
        );

        const recentTasks = await findRecentTasks(
            message.sender_id,
            message.receiver_id
        );

        const relevantTasks = await findRelevantTasks(
            message.content,
            embedding,
            recentTasks.filter(t => t.status === 'pending') 
        );

        console.log(`Found ${relevantTasks.length} relevant tasks for potential updates`);
        if (relevantTasks.length > 0) {
            console.log('Top relevant task:', {
                id: relevantTasks[0].task.id,
                content: relevantTasks[0].task.content,
                similarity: relevantTasks[0].similarity,
                reasons: relevantTasks[0].reasons
            });
        }

        const taskExtraction = await extractTaskFromEmbeddings(
            message.content, 
            similarMessages,
            recentTasks,
            relevantTasks
        );

        if (taskExtraction) {
            console.log('Task action detected:', {
                action: taskExtraction.action,
                confidence: taskExtraction.confidence,
                matched_task_id: taskExtraction.matched_task_id
            });
            
            switch (taskExtraction.action) {
                case 'create':
                    const newTask: Task = {
                        content: taskExtraction.task,
                        priority: taskExtraction.priority,
                        confidence: taskExtraction.confidence,
                        description: taskExtraction.description,
                        message_id: message.id,
                        sender_id: message.sender_id,
                        receiver_id: message.receiver_id,
                        status: 'pending',
                        created_at: getCurrentDateTime(),
                        due_date: taskExtraction.due_date
                    };
                    await saveTask(newTask);
                    break;

                case 'update':
                    if (taskExtraction.matched_task_id) {
                        const updates: Partial<Task> = {};
                        
                        // Only update specified fields
                        if (taskExtraction.update_fields?.includes('content')) {
                            updates.content = taskExtraction.task;
                        }
                        if (taskExtraction.update_fields?.includes('priority')) {
                            updates.priority = taskExtraction.priority;
                        }
                        if (taskExtraction.update_fields?.includes('due_date')) {
                            updates.due_date = taskExtraction.due_date;
                        }
                        if (taskExtraction.update_fields?.includes('description')) {
                            updates.description = taskExtraction.description;
                        }

                        console.log('Updating task with fields:', Object.keys(updates));
                        await updateExistingTask(taskExtraction.matched_task_id, updates);
                    } else {
                        console.log('No task ID found for update, creating new task');
                        // Fallback to creating new task
                        const fallbackTask: Task = {
                            content: taskExtraction.task,
                            priority: taskExtraction.priority,
                            confidence: taskExtraction.confidence,
                            description: taskExtraction.description,
                            message_id: message.id,
                            sender_id: message.sender_id,
                            receiver_id: message.receiver_id,
                            status: 'pending',
                            created_at: getCurrentDateTime(),
                            due_date: taskExtraction.due_date
                        };
                        await saveTask(fallbackTask);
                    }
                    break;

                case 'complete':
                    if (taskExtraction.matched_task_id) {
                        console.log('Completing task:', taskExtraction.matched_task_id);
                        await updateExistingTask(taskExtraction.matched_task_id, {
                            status: 'completed',
                            completed_at: getCurrentDateTime()
                        });
                    } else {
                        console.log('No task found to complete');
                    }
                    break;

                case 'cancel':
                    if (taskExtraction.matched_task_id) {
                        console.log('Cancelling task:', taskExtraction.matched_task_id);
                        await updateExistingTask(taskExtraction.matched_task_id, {
                            status: 'cancelled'
                        });
                    } else {
                        console.log('No task found to cancel');
                    }
                    break;

                default:
                    console.log('Unknown action:', taskExtraction.action);
            }
        } else {
            console.log('No task action detected in message');
        }
        
    } catch (error) {
        console.error('Error processing message:', error);
    }
}

async function startWorker() {
    console.log('Starting enhanced task management worker...');

    const subscription = supabase
        .channel('messages_channel')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            },
            async (payload) => {
                console.log('New message received');
                await processMessage(payload.new as Message);
            }
        )
        .subscribe();

    console.log('Subscription active',subscription);

    console.log('Processing existing messages...');
    const { data: existingMessages, error } = await supabase
        .from('messages')
        .select('*')
        .is('embedding', null)
        .order('created_at', { ascending: true })
        .limit(50);

    if (error) {
        console.error('Error fetching existing messages:', error);
    } else if (existingMessages && existingMessages.length > 0) {
        console.log(`Processing ${existingMessages.length} existing messages...`);
        for (const message of existingMessages) {
            await processMessage(message);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        console.log('Finished processing existing messages');
    } else {
        console.log('No unprocessed messages found');
    }
}

startWorker().catch(console.error);

process.on('SIGINT', () => {
    console.log('Shutting down enhanced worker...');
    process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down enhanced worker...');
  process.exit(0);
});

function getCurrentDateTime(): string {
  return new Date().toISOString();
}