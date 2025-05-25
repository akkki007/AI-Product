import React, { useState, useEffect } from "react";
import { Check, Clock, Calendar, Loader2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (you should move this to a separate config file)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Task {
  id: string;
  content: string;
  priority: "low" | "medium" | "high" | "urgent";
  confidence: number;
  reasoning: string;
  message_id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date?: string;
  completed_at?: string;
  created_at: string;
}

interface TodoItemProps {
  task: Task;
  onToggle: (id: string, newStatus: string) => void;
}

const TodoItem = React.memo(function TodoItem({ task, onToggle }: TodoItemProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < new Date();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-orange-100 text-orange-700";
    }
  };

  const handleStatusChange = () => {
    if (isCompleted) {
      onToggle(task.id, 'pending');
    } else {
      onToggle(task.id, 'completed');
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isCompleted
          ? "bg-slate-50 border-slate-200 opacity-75"
          : isOverdue
          ? "bg-red-50 border-red-200"
          : "bg-white border-slate-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={handleStatusChange}
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted ? "bg-green-500 border-green-500 text-white" : "border-slate-300 hover:border-blue-500"
          }`}
        >
          {isCompleted && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-medium ${isCompleted ? "line-through text-slate-500" : "text-slate-800"}`}>
              {task.content}
            </h3>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {task.reasoning && (
            <p className={`text-sm mb-3 ${isCompleted ? "text-slate-400" : "text-slate-600"}`}>
              {task.reasoning}
            </p>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
              </div>
              {task.confidence && (
                <div className="flex items-center space-x-1 text-slate-500">
                  <span>Confidence: {Math.round(task.confidence * 100)}%</span>
                </div>
              )}
            </div>

            {task.due_date && (
              <div className={`flex items-center space-x-1 ${isOverdue ? "text-red-600" : "text-slate-500"}`}>
                <Clock className="w-3 h-3" />
                <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TodoItem.displayName = "TodoItem";

const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          setCurrentUserId(user.id);
        } else {
          setError('User not authenticated');
        }
      } catch (err) {
        console.error('Error getting user:', err);
        setError('Failed to get user information');
      }
    };

    getCurrentUser();
  }, []);

  // Fetch tasks for current user
  useEffect(() => {
    if (!currentUserId) return;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('receiver_id', currentUserId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTasks(data || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUserId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('tasks_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Real-time task update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as Task : task
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const toggleTask = async (taskId: string, newStatus: string) => {
    try {
      const updateData: { status: string; completed_at?: string | null } = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'pending') {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task');
    }
  };

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    overdue: tasks.filter((t) => 
      t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
    ).length,
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
        <p className="text-slate-600">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="mb-2">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-500 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Todo Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">My Tasks</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">LIVE</span>
          </div>
        </div>

        {/* Todo Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">COMPLETED</p>
            <p className="text-lg font-bold text-blue-700">{taskStats.completed}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <p className="text-xs text-orange-600 font-medium">PENDING</p>
            <p className="text-lg font-bold text-orange-700">{taskStats.pending}</p>
          </div>
        </div>

        {taskStats.overdue > 0 && (
          <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-xs text-red-600 font-medium">⚠️ OVERDUE TASKS</p>
            <p className="text-lg font-bold text-red-700">{taskStats.overdue}</p>
          </div>
        )}
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg font-medium">No tasks assigned yet</p>
            <p className="text-slate-400 text-sm">Tasks extracted from your messages will appear here</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TodoItem key={task.id} task={task} onToggle={toggleTask} />
          ))
        )}
      </div>

      {/* Todo Footer */}
      {tasks.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {taskStats.completed} of {taskStats.total} tasks completed
            </p>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoList;