"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const openai_1 = __importDefault(require("openai"));
// Initialize Supabase client
const supabase = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Initialize OpenAI client
const openai = new openai_1.default({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
        "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "AI Task Manager",
    },
});
async function generateEmbedding(text) {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });
        return response.data[0].embedding;
    }
    catch (error) {
        console.error('Error generating embedding:', error);
        return [];
    }
}
async function findSimilarMessages(currentEmbedding, senderId, receiverId, limit = 5) {
    try {
        // Query for messages with embeddings between the same users
        const { data: messages, error } = await supabase
            .from('messages')
            .select('content, embedding, created_at')
            .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
            .not('embedding', 'is', null)
            .limit(50);
        if (error || !messages) {
            console.error('Error fetching messages for similarity:', error);
            return [];
        }
        // Calculate cosine similarity
        const similarities = messages.map(msg => {
            if (!msg.embedding || !Array.isArray(msg.embedding))
                return null;
            const similarity = cosineSimilarity(currentEmbedding, msg.embedding);
            return {
                content: msg.content,
                similarity,
                timestamp: msg.created_at
            };
        }).filter(Boolean);
        // Sort by similarity and return top results
        return similarities
            .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
            .slice(0, limit);
    }
    catch (error) {
        console.error('Error finding similar messages:', error);
        return [];
    }
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
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
async function extractTaskFromEmbeddings(currentMessage, similarMessages = []) {
    try {
        // Construct context from similar messages
        const contextString = similarMessages.length > 0
            ? similarMessages.map((msg, i) => `Context ${i + 1} (similarity: ${msg.similarity?.toFixed(2) || 'N/A'}): "${msg.content}"`).join('\n')
            : "No similar context available.";
        const completion = await openai.chat.completions.create({
            model: "anthropic/claude-3-sonnet",
            messages: [
                {
                    role: "system",
                    content: `You are a task extraction AI. Your job is to analyze messages and extract actionable tasks with priorities.

PRIORITY LEVELS:
- urgent: Critical, time-sensitive, needs immediate attention
- high: Important, deadline within 24-48 hours
- medium: Moderate importance, can wait a few days
- low: Nice to have, no strict deadline

EXTRACTION RULES:
1. Only extract if there's a clear, actionable task
2. Be specific about what needs to be done
3. Consider context from similar messages
4. If no task is found, return null

RESPONSE FORMAT (JSON only):
{
  "task": "specific actionable task or null",
  "priority": "low|medium|high|urgent or null",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of priority decision"
}`
                },
                {
                    role: "user",
                    content: `CURRENT MESSAGE: "${currentMessage}"

SIMILAR CONTEXT FROM CHAT HISTORY:
${contextString}

Extract the task and priority from the current message, using the context to better understand urgency and importance. Respond with JSON only.`
                }
            ],
            temperature: 0.3,
            max_tokens: 300
        });
        const response = completion.choices[0]?.message?.content;
        if (!response) {
            throw new Error('No response from AI');
        }
        // Parse JSON response
        const parsed = JSON.parse(response.trim());
        // Validate response
        if (!parsed.task || parsed.task === 'null' || parsed.task.toLowerCase() === 'null') {
            return null;
        }
        return parsed;
    }
    catch (error) {
        console.error('Error extracting task:', error);
        return null;
    }
}
async function saveTask(task) {
    try {
        const { error } = await supabase
            .from('tasks')
            .insert([task]);
        if (error) {
            console.error('Error saving task:', error);
            return false;
        }
        console.log('Task saved successfully:', task.content);
        return true;
    }
    catch (error) {
        console.error('Error saving task:', error);
        return false;
    }
}
async function processMessage(message) {
    try {
        console.log('Processing message:', message.id);
        // Generate embedding if not exists
        let embedding = message.embedding;
        if (!embedding || embedding.length === 0) {
            console.log('Generating embedding for message...');
            embedding = await generateEmbedding(message.content);
            // Update message with embedding
            if (embedding.length > 0) {
                await supabase
                    .from('messages')
                    .update({ embedding })
                    .eq('id', message.id);
            }
        }
        // Find similar messages for context
        const similarMessages = await findSimilarMessages(embedding, message.sender_id, message.receiver_id);
        // Extract task from message
        const taskExtraction = await extractTaskFromEmbeddings(message.content, similarMessages);
        if (taskExtraction) {
            console.log('Task extracted:', taskExtraction);
            // Create task record
            const task = {
                content: taskExtraction.task,
                priority: taskExtraction.priority,
                confidence: taskExtraction.confidence,
                reasoning: taskExtraction.reasoning,
                message_id: message.id,
                sender_id: message.sender_id,
                receiver_id: message.receiver_id,
                status: 'pending'
            };
            // Save task to database
            await saveTask(task);
        }
        else {
            console.log('No task found in message:', message.content);
        }
    }
    catch (error) {
        console.error('Error processing message:', error);
    }
}
async function startWorker() {
    console.log('Starting message worker...');
    // Subscribe to new messages
    const subscription = supabase
        .channel('messages_channel')
        .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
    }, async (payload) => {
        console.log('New message event:', payload.eventType);
        await processMessage(payload.new);
    })
        .subscribe();
    console.log('Subscription status:', subscription);
    // Process existing messages that haven't been processed
    console.log('Processing existing messages...');
    const { data: existingMessages, error } = await supabase
        .from('messages')
        .select('*')
        .is('embedding', null) // Only process messages without embeddings
        .order('created_at', { ascending: true })
        .limit(100); // Process in batches
    if (error) {
        console.error('Error fetching existing messages:', error);
    }
    else if (existingMessages && existingMessages.length > 0) {
        console.log(`Processing ${existingMessages.length} existing messages...`);
        for (const message of existingMessages) {
            await processMessage(message);
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Finished processing existing messages');
    }
    else {
        console.log('No unprocessed messages found');
    }
}
// Start the worker
startWorker().catch(console.error);
// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down worker...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down worker...');
    process.exit(0);
});
