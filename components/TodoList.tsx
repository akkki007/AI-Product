"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence, LayoutGroup } from "framer-motion"
import { Check, Clock, Calendar, Loader2, AlertTriangle, TrendingUp } from "lucide-react"
import { supabase } from "@/utils/supabase"

interface Task {
  id: string
  content: string
  priority: "low" | "medium" | "high" | "urgent"
  confidence: number
  reasoning: string
  message_id: string
  sender_id: string
  receiver_id: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  due_date?: string
  completed_at?: string
  created_at: string
  description?: string
}

interface TodoItemProps {
  task: Task
  onToggle: (id: string, newStatus: string) => void
  index: number
}

const STATUS_STYLES: Record<string, string> = {
  completed:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  in_progress: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  high: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  medium:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  low: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
}

const PRIORITY_ICONS: Record<string, string> = {
  urgent: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: { duration: 0.2 },
  },
}

const TodoItem = React.memo(function TodoItem({ task, onToggle, index }: TodoItemProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(task.content)
  const [editPriority, setEditPriority] = useState(task.priority)
  const [editDueDate, setEditDueDate] = useState(task.due_date || "")
  const [editDescription, setEditDescription] = useState(task.description || "")
  const isCompleted = task.status === "completed"
  const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < new Date()

  const handleToggle = useCallback(async () => {
    setIsUpdating(true)
    try {
      await onToggle(task.id, isCompleted ? "pending" : "completed")
    } finally {
      setTimeout(() => setIsUpdating(false), 300)
    }
  }, [task.id, isCompleted, onToggle])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditContent(task.content)
    setEditPriority(task.priority)
    setEditDueDate(task.due_date || "")
    setEditDescription(task.description || "")
  }

  const handleSave = async () => {
    setIsUpdating(true)
    try {
      const updateData: any = {
        content: editContent.trim(),
        priority: editPriority,
        due_date: editDueDate || null,
        description: editDescription.trim() || null,
      }
      const { error } = await supabase.from("tasks").update(updateData).eq("id", task.id)
      if (error) throw error
      setIsEditing(false)
    } catch (err) {
      alert("Failed to update task. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={`p-4 rounded-xl border transition-all flex flex-col gap-3 ${
        isCompleted
          ? "bg-muted/50 border-border opacity-75"
          : isOverdue
            ? "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800"
            : "bg-card border-border hover:shadow-md dark:hover:shadow-lg"
      }`}
      whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.1)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleToggle}
            disabled={isUpdating}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isCompleted
                ? "bg-green-500 border-green-500 text-white"
                : "border-muted-foreground/30 hover:border-primary"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {isUpdating ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                </motion.div>
              ) : isCompleted ? (
                <motion.div
                  key="check"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.button>

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isUpdating}
                />
                <div className="flex gap-2">
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as Task["priority"])}
                    className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isUpdating}
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isUpdating}
                  />
                </div>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-2 py-1 border border-border rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Description (optional)"
                  disabled={isUpdating}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSave}
                    className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                    disabled={isUpdating || !editContent.trim()}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 rounded bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <motion.span
                className={`font-medium block ${isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}
                animate={{
                  textDecoration: isCompleted ? "line-through" : "none",
                }}
                transition={{ duration: 0.3 }}
                onClick={handleEdit}
                style={{ cursor: "pointer" }}
                title="Click to edit"
              >
                {task.content}
              </motion.span>
            )}

            {!isEditing && task.reasoning && (
              <motion.p
                className="text-xs text-muted-foreground mt-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.1 }}
              >
                {task.reasoning}
              </motion.p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <motion.span
            className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${
              PRIORITY_STYLES[task.priority] || "bg-muted text-muted-foreground border-border"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <span>{PRIORITY_ICONS[task.priority]}</span>
            {task.priority}
          </motion.span>

          <motion.span
            className={`px-3 py-1 text-xs font-medium rounded-full ${
              STATUS_STYLES[task.status] || "bg-muted text-muted-foreground"
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {task.status.replace("_", " ")}
          </motion.span>
        </div>
      </div>

      <motion.div
        className="flex flex-wrap gap-4 text-xs text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
        </div>

        {task.confidence !== undefined && (
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Confidence: {Math.round(task.confidence * 100)}%</span>
          </div>
        )}

        {task.due_date && (
          <motion.div
            className={`flex items-center gap-1 ${
              isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
            {isOverdue && <AlertTriangle className="w-3 h-3 ml-1" />}
          </motion.div>
        )}
      </motion.div>

      {!isEditing && task.description && (
        <motion.details className="mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <summary className="cursor-pointer text-xs text-primary hover:text-primary/80 transition-colors">
            Description
          </summary>
          <motion.div
            className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
          >
            {task.description}
          </motion.div>
        </motion.details>
      )}
    </motion.div>
  )
})

TodoItem.displayName = "TodoItem"

const LoadingSkeleton = () => (
  <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="p-4 rounded-xl border border-border bg-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 bg-muted rounded-full animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse flex-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
          <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
        </div>
      </motion.div>
    ))}
  </motion.div>
)

const TodoList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "overdue">("all")
  const [layout, setLayout] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState("created_at")
  const [priorityFilter, setPriorityFilter] = useState("")

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        if (error) throw error

        if (user) {
          setCurrentUserId(user.id)
        } else {
          setError("User not authenticated")
        }
      } catch (err) {
        console.error("Error getting user:", err)
        setError("Failed to get user information")
      }
    }

    getCurrentUser()
  }, [])

  // Fetch tasks for current user
  useEffect(() => {
    if (!currentUserId) return

    const fetchTasks = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("receiver_id", currentUserId)
          .order("created_at", { ascending: false })

        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        console.error("Error fetching tasks:", err)
        setError("Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [currentUserId])

  // Set up real-time subscription
  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel("tasks_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log("Real-time task update:", payload)

          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) => prev.map((task) => (task.id === payload.new.id ? (payload.new as Task) : task)))
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId])

  const toggleTask = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const updateData: { status: string; completed_at?: string | null } = { status: newStatus }

      if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString()
      } else if (newStatus === "pending") {
        updateData.completed_at = null
      }

      const { error } = await supabase.from("tasks").update(updateData).eq("id", taskId)

      if (error) throw error
    } catch (err) {
      console.error("Error updating task:", err)
      setError("Failed to update task")
    }
  }, [])

  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed").length
    const pending = tasks.filter((t) => t.status === "pending").length
    const in_progress = tasks.filter((t) => t.status === "in_progress").length
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date(),
    ).length

    return { total, completed, pending, in_progress, overdue }
  }, [tasks])

  const filteredTasks = useMemo(() => {
    let filtered = tasks
    switch (filter) {
      case "pending":
        filtered = filtered.filter((t) => t.status === "pending")
        break
      case "completed":
        filtered = filtered.filter((t) => t.status === "completed")
        break
      case "overdue":
        filtered = filtered.filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date())
        break
      default:
        break
    }
    if (priorityFilter) {
      filtered = filtered.filter((t) => t.priority === priorityFilter)
    }
    // Sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "due_date") {
        return (a.due_date || "").localeCompare(b.due_date || "")
      }
      if (sortBy === "priority") {
        const order = { urgent: 1, high: 2, medium: 3, low: 4 }
        return (order[a.priority] || 5) - (order[b.priority] || 5)
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status)
      }
      // Default: created_at (descending)
      return (b.created_at || "").localeCompare(a.created_at || "")
    })
    return filtered
  }, [tasks, filter, sortBy, priorityFilter])

  if (loading) {
    return (
      <motion.div className="flex flex-col h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-muted rounded-full animate-pulse" />
              <div className="h-4 w-8 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted p-3 rounded-lg">
              <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse mb-2" />
              <div className="h-6 w-8 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="h-3 w-12 bg-muted-foreground/20 rounded animate-pulse mb-2" />
              <div className="h-6 w-8 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <LoadingSkeleton />
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        className="flex flex-col h-full items-center justify-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div className="text-destructive text-center" initial={{ y: 20 }} animate={{ y: 0 }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p className="mb-4 font-medium">⚠️ {error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="text-primary hover:text-primary/80 font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Retry
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div className="flex flex-col h-full bg-card" variants={containerVariants} animate="visible">
      {/* Header */}
      <motion.div className="p-6 border-b border-border" variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">My Tasks</h2>
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">LIVE</span>
          </div>
        </div>

        {/* Adjustable Controls */}
        <div className="flex flex-wrap gap-2 items-center mt-2 mb-4">
          {/* Layout Toggle */}
          <button
            className={`px-2 py-1 rounded border text-xs transition-colors ${
              layout === "list"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setLayout("list")}
          >
            List
          </button>
          <button
            className={`px-2 py-1 rounded border text-xs transition-colors ${
              layout === "grid"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setLayout("grid")}
          >
            Grid
          </button>

          {/* Sort */}
          <select
            className="ml-2 px-2 py-1 border border-border rounded text-xs bg-background text-foreground"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">Sort by Created</option>
            <option value="due_date">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="status">Sort by Status</option>
          </select>

          {/* Priority Filter */}
          <select
            className="ml-2 px-2 py-1 border border-border rounded text-xs bg-background text-foreground"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg" whileHover={{ scale: 1.02 }}>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">COMPLETED</p>
            <motion.p
              className="text-lg font-bold text-blue-700 dark:text-blue-300"
              key={taskStats.completed}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {taskStats.completed}
            </motion.p>
          </motion.div>
          <motion.div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg" whileHover={{ scale: 1.02 }}>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">PENDING</p>
            <motion.p
              className="text-lg font-bold text-orange-700 dark:text-orange-300"
              key={taskStats.pending}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {taskStats.pending}
            </motion.p>
          </motion.div>
        </div>

        <AnimatePresence>
          {taskStats.overdue > 0 && (
            <motion.div
              className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                OVERDUE TASKS
              </p>
              <motion.p
                className="text-lg font-bold text-red-700 dark:text-red-300"
                key={taskStats.overdue}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {taskStats.overdue}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-4">
          {["all", "pending", "completed", "overdue"].map((filterType) => (
            <motion.button
              key={filterType}
              onClick={() => setFilter(filterType as any)}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                filter === filterType
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {filteredTasks.length === 0 ? (
            <motion.div
              className="text-center py-12 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <Calendar className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              </motion.div>
              <p className="text-muted-foreground text-lg font-medium">
                {filter === "all" ? "No tasks assigned yet" : `No ${filter} tasks`}
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {filter === "all"
                  ? "Tasks extracted from your messages will appear here"
                  : `Switch to "all" to see other tasks`}
              </p>
            </motion.div>
          ) : (
            <LayoutGroup>
              <motion.div
                className={layout === "grid" ? "p-4 grid grid-cols-1 sm:grid-cols-2 gap-4" : "p-4 space-y-3"}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, index) => (
                    <TodoItem key={task.id} task={task} onToggle={toggleTask} index={index} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </LayoutGroup>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <AnimatePresence>
        {tasks.length > 0 && (
          <motion.div
            className="p-4 border-t border-border bg-muted/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="text-center">
              <motion.p className="text-sm text-muted-foreground" key={`${taskStats.completed}-${taskStats.total}`}>
                {taskStats.completed} of {taskStats.total} tasks completed
              </motion.p>
              <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
                <motion.div
                  className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TodoList
