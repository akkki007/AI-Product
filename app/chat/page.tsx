"use client"
import type React from "react"
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react"
import { supabase } from "@/utils/supabase"
import {
  Search,
  LogOut,
  X,
  MessageSquare,
  Users,
  CheckSquare,
  Send,
  ArrowLeft,
  MoreVertical,
  Settings,
  Phone,
  Video,
  Info,
} from "lucide-react"
import { CohereClient } from "cohere-ai"
import useDebounce from "@/hooks/useDebounce"
import { ThemeToggle } from "@/components/theme-toggle"
// Lazy load components
const TodoList = lazy(() => import("@/components/TodoList"))
const MessageBubble = lazy(() => import("@/components/MessageBubble"))
const UserListItem = lazy(() => import("@/components/UserListItem"))
const EmptyChatState = lazy(() => import("@/components/EmptyChatState"))

interface ChatUser {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  updated_at?: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read?: boolean
  is_calendar_event?: boolean
  is_optimistic?: boolean
  failed?: boolean
}

const ResponsiveChatApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [users, setUsers] = useState<ChatUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [chatSearchTerm, setChatSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"chats" | "todos">("chats")
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [todoSidebarCollapsed, setTodoSidebarCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null)

  const getInitials = useCallback((user: ChatUser) => {
    if (user.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    return (user.username || user.id)[0].toUpperCase()
  }, [])

  const getDisplayName = useCallback((user: ChatUser) => {
    return user.full_name || user.username || user.id
  }, [])

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedChatSearchTerm = useDebounce(chatSearchTerm, 300)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => getDisplayName(user).toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  }, [users, debouncedSearchTerm, getDisplayName])

  const filteredMessages = useMemo(() => {
    if (!debouncedChatSearchTerm) return messages
    return messages.filter((message) => message.content.toLowerCase().includes(debouncedChatSearchTerm.toLowerCase()))
  }, [messages, debouncedChatSearchTerm])

  // Keyboard shortcuts for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder="Search conversations..."]') as HTMLInputElement
        if (searchInput) searchInput.focus()
      }

      // Ctrl/Cmd + / to focus message input
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault()
        if (inputRef.current) inputRef.current.focus()
      }

      // Escape to clear search
      if (e.key === "Escape") {
        if (chatSearchTerm) {
          setChatSearchTerm("")
        } else if (searchTerm) {
          setSearchTerm("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [chatSearchTerm, searchTerm])

  

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true)

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        if (session?.user) {
          const user = session.user
          const userData = {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          }

          setCurrentUser(userData)
          await loadUsers()

          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", user.id)

          if (profilesError) throw profilesError
          setUsers(profiles || [])
        }
      } catch (error) {
        console.error("Initialization error:", error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user
        const userData = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
        }

        setCurrentUser(userData)
        await loadUsers()
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        setUsers([])
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const loadUsers = useCallback(async () => {
    if (!currentUser?.id) return

    setLoadingUsers(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUser.id)
        .order("full_name", { ascending: true })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoadingUsers(false)
    }
  }, [currentUser?.id])

  const loadMessages = useCallback(
    async (userId: string) => {
      if (!currentUser) return

      setLoadingMessages(true)
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`,
          )
          .order("created_at", { ascending: true })

        if (error) throw error
        setMessages(data || [])
      } catch (error) {
        console.error("Failed to load messages:", error)
        setMessages([])
      } finally {
        setLoadingMessages(false)
      }
    },
    [currentUser],
  )

  const markMessagesAsRead = useCallback(
    async (senderId: string) => {
      if (!currentUser) return

      try {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("sender_id", senderId)
          .eq("receiver_id", currentUser.id)
          .eq("is_read", false)

        if (error) {
          console.error("Error marking messages as read:", error)
        }
      } catch (error) {
        console.error("Failed to mark messages as read:", error)
      }
    },
    [currentUser],
  )

  useEffect(() => {
  if (!currentUser || !selectedUser) return

  const channel = supabase
    .channel(`messages:${currentUser.id}:${selectedUser.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`,
      },
      (payload) => {
        const newMessage = payload.new as Message
        
        setMessages((prev) => {
          // Check if message already exists (including optimistic messages)
          const existingMessage = prev.find(msg => 
            msg.id === newMessage.id || 
            (msg.is_optimistic && msg.content === newMessage.content && 
             msg.sender_id === newMessage.sender_id && 
             Math.abs(new Date(msg.created_at).getTime() - new Date(newMessage.created_at).getTime()) < 5000)
          )
          
          if (existingMessage) {
            // Replace optimistic message with real one
            if (existingMessage.is_optimistic) {
              return prev.map(msg => 
                msg.id === existingMessage.id 
                  ? { ...newMessage, is_optimistic: false }
                  : msg
              )
            }
            // Message already exists, don't duplicate
            return prev
          }
          
          // New message, add it
          return [...prev, newMessage]
        })

        // Mark as read if it's from the selected user
        if (newMessage.sender_id === selectedUser.id) {
          markMessagesAsRead(newMessage.sender_id)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [currentUser, selectedUser, markMessagesAsRead])

  useEffect(() => {
    if (!currentUser || !selectedUser) return

    const typingChannel = supabase
      .channel(`typing:${selectedUser.id}:${currentUser.id}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.userId && payload.payload.userId !== currentUser.id) {
          setTypingUsers((prev) => new Set(prev).add(payload.payload.userId))
          setTimeout(() => {
            setTypingUsers((prev) => {
              const newSet = new Set(prev)
              newSet.delete(payload.payload.userId)
              return newSet
            })
          }, 2000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(typingChannel)
    }
  }, [currentUser, selectedUser])

  useEffect(() => {
    if (selectedUser && currentUser) {
      setMessages([])
      loadMessages(selectedUser.id)
      markMessagesAsRead(selectedUser.id)
      setShowMobileChat(true)
    }
  }, [selectedUser, currentUser, loadMessages, markMessagesAsRead])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [filteredMessages])

  const handleTyping = useCallback(async () => {
    if (!selectedUser || !currentUser) return

    if (!isTyping) {
      setIsTyping(true)
      const typingChannel = supabase.channel(`typing:${currentUser.id}:${selectedUser.id}`)
      await typingChannel.subscribe()
      typingChannel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUser.id },
      })
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 1000)
  }, [selectedUser, currentUser, isTyping])

 const sendMessage = useCallback(async () => {
  const messageContent = newMessage.trim()
  if (!messageContent || !selectedUser || !currentUser || sendingMessage) return

  setSendingMessage(true)
  const tempId = `temp_${Date.now()}_${Math.random()}`

  // Optimistic UI update
  const optimisticMessage: Message = {
    id: tempId,
    sender_id: currentUser.id,
    receiver_id: selectedUser.id,
    content: messageContent,
    created_at: new Date().toISOString(),
    is_read: false,
    is_calendar_event: false,
    is_optimistic: true,
  }

  setMessages((prev) => [...prev, optimisticMessage])
  setNewMessage("")

  try {
    const cohere = new CohereClient({
      token: "8K8HLAByaR7Pd7ctj4kEwdha32Y0QId9EriGAU2V",
    })

    const embed = await cohere.embed({
      texts: [messageContent],
      model: "embed-english-v3.0",
      inputType: "search_document",
    })

    if (!embed?.embeddings || !Array.isArray(embed.embeddings)) {
      throw new Error("Failed to generate embedding")
    }

    const embedding: number[] = embed.embeddings[0]

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: messageContent,
        embedding: embedding,
        is_read: false,
        is_calendar_event: false,
      })
      .select()
      .single()

    if (error) throw error

    if (data) {
      // Remove the optimistic message and let the real-time subscription add the real one
      setMessages((prev) => prev.filter(msg => msg.id !== tempId))
    }
  } catch (error) {
    console.error("Failed to send message:", error)
    // Mark message as failed
    setMessages((prev) =>
      prev.map((msg) => (msg.id === tempId ? { ...msg, failed: true, is_optimistic: false } : msg))
    )
    setNewMessage(messageContent)
  } finally {
    setSendingMessage(false)
  }
}, [newMessage, selectedUser, currentUser, sendingMessage])

  const retryMessage = useCallback(
    async (failedMessage: Message) => {
      if (!selectedUser || !currentUser) return

      // Remove failed message and retry
      setMessages((prev) => prev.filter((msg) => msg.id !== failedMessage.id))
      setNewMessage(failedMessage.content)

      // Focus input for user to retry
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus()
      }, 100)
    },
    [selectedUser, currentUser],
  )

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }, [])

  const clearChatSearch = useCallback(() => {
    setChatSearchTerm("")
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  const handleBackToChats = useCallback(() => {
    setShowMobileChat(false)
    setSelectedUser(null)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center bg-card p-8 rounded-2xl shadow-xl border">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access your chat workspace</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showMobileChat && selectedUser ? (
              <button
                onClick={handleBackToChats}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium text-sm">{getInitials(currentUser)}</span>
              </div>
            )}
            <h1 className="text-lg font-semibold text-foreground">
              {showMobileChat && selectedUser ? getDisplayName(selectedUser) : "Chat App"}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {!showMobileChat && (
              <>
                <button
                  onClick={() => setActiveTab("chats")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === "chats" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <ThemeToggle/>
                <button
                  onClick={() => setActiveTab("todos")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === "todos" ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full h-full">
        {/* Left Sidebar - Chats */}
        <div
          className={`${sidebarCollapsed ? "w-16" : "w-80 2xl:w-96"} border-r bg-card flex flex-col transition-all duration-300 flex-shrink-0`}
        >
          {/* Header */}
          <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              {!sidebarCollapsed && <h1 className="text-xl font-bold text-foreground">Messages</h1>}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                {!sidebarCollapsed && (
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations... (⌘K)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                />
              </div>
            )}
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                {!sidebarCollapsed && <p className="text-muted-foreground">Loading...</p>}
              </div>
            ) : filteredUsers.length === 0 ? (
              !sidebarCollapsed && (
                <div className="p-6 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">
                    {debouncedSearchTerm ? "No matching users found" : "No conversations yet"}
                  </p>
                  <p className="text-muted-foreground/70 text-sm mt-1">
                    {debouncedSearchTerm ? "Try a different search term" : "Start a new conversation"}
                  </p>
                </div>
              )
            ) : (
              <Suspense fallback={<div className="p-6 text-center">Loading users...</div>}>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-all border-l-4 ${
                      selectedUser?.id === user.id ? "border-l-primary bg-muted/30" : "border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-foreground font-medium text-sm">{getInitials(user)}</span>
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{getDisplayName(user)}</p>
                          <p className="text-sm text-muted-foreground truncate">Click to start chatting</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Suspense>
            )}
          </div>

          {/* User Profile */}
          <div className="p-4 border-t bg-muted/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-medium text-sm">{getInitials(currentUser)}</span>
                </div>
                {!sidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{getDisplayName(currentUser)}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {!sidebarCollapsed && (
                  <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Chat Area */}
        <div className="flex-1 bg-card flex flex-col min-w-0">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b bg-card/95 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground font-medium">{getInitials(selectedUser)}</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-foreground truncate">{getDisplayName(selectedUser)}</h2>
                      {typingUsers.has(selectedUser.id) ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-sm text-primary">typing...</span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Online • Last seen recently</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search messages... (⌘/)"
                        value={chatSearchTerm}
                        onChange={(e) => setChatSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                      />
                      {chatSearchTerm && (
                        <button
                          onClick={clearChatSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        <Info className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div
                  ref={messagesContainerRef}
                  className="h-full overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-muted/10 to-background"
                >
                  {loadingMessages && messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground text-lg">Loading messages...</p>
                    </div>
                  ) : (
                    <>
                      {filteredMessages.length === 0 && chatSearchTerm ? (
                        <div className="text-center py-16">
                          <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No messages found</h3>
                          <p className="text-muted-foreground/70">Try searching for something else</p>
                        </div>
                      ) : filteredMessages.length === 0 ? (
                        <div className="text-center py-16">
                          <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">Start your conversation</h3>
                          <p className="text-muted-foreground/70">Send a message to get started</p>
                        </div>
                      ) : (
                        <Suspense fallback={<div className="text-center py-8">Loading messages...</div>}>
                          {filteredMessages.map((message) => (
                            <div key={message.id} className="group">
                              <MessageBubble
                                message={message}
                                isCurrentUser={message.sender_id === currentUser.id}
                                isHighlighted={
                                  chatSearchTerm.length > 0 &&
                                  message.content.toLowerCase().includes(chatSearchTerm.toLowerCase())
                                }
                              />
                              {message.failed && (
                                <div className="flex justify-end mt-2">
                                  <button
                                    onClick={() => retryMessage(message)}
                                    className="text-sm text-destructive hover:text-destructive/80 transition-colors px-3 py-1 rounded-md hover:bg-destructive/10"
                                  >
                                    Failed to send • Click to retry
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </Suspense>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-6 border-t bg-card/95 backdrop-blur-sm flex-shrink-0">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message... (Enter to send)"
                      disabled={sendingMessage}
                      className="w-full border border-border rounded-xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-background text-base"
                    />
                    {sendingMessage && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-muted border-t-primary rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-4 rounded-xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center min-w-[80px]"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <MessageSquare className="w-20 h-20 text-muted-foreground/50 mx-auto mb-6" />
                  <h2 className="text-2xl font-semibold text-foreground mb-3">Welcome to Chat</h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Select a conversation from the sidebar to start messaging
                  </p>
                  <div className="text-sm text-muted-foreground/70 space-y-1">
                    <p>⌘K to search conversations</p>
                    <p>⌘/ to focus message input</p>
                    <p>Esc to clear search</p>
                  </div>
                </div>
              </div>
            </Suspense>
          )}
        </div>

        {/* Right Sidebar - Todos */}
        <div
          className={`${todoSidebarCollapsed ? "w-16" : "w-80 2xl:w-96"} border-l bg-card flex flex-col transition-all duration-300 flex-shrink-0`}
        >
          <div className="p-6 border-b flex items-center justify-between">
            {!todoSidebarCollapsed && <h2 className="text-xl font-bold text-foreground">Tasks</h2>}
            <button
              onClick={() => setTodoSidebarCollapsed(!todoSidebarCollapsed)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
            >
              <CheckSquare className="w-5 h-5" />
            </button>
          </div>
          {!todoSidebarCollapsed && (
            <Suspense fallback={<div className="p-4">Loading todos...</div>}>
              <TodoList />
            </Suspense>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full h-full pt-16">
        <div
          className={`${
            showMobileChat ? "hidden" : activeTab === "chats" ? "block" : "hidden"
          } w-full border-r bg-card flex flex-col h-full`}
        >
          {/* Mobile Chats List */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingUsers ? (
              <div className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">
                  {debouncedSearchTerm ? "No matching users found" : "No conversations yet"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium">{getInitials(user)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{getDisplayName(user)}</p>
                      <p className="text-sm text-muted-foreground truncate">Tap to start chatting</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Chat View */}
        {showMobileChat && selectedUser && (
          <div className="w-full bg-card flex flex-col h-full">
            {/* Mobile Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div ref={messagesContainerRef} className="h-full overflow-y-auto p-4 space-y-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-muted-foreground">Loading messages...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Start your conversation</p>
                  </div>
                ) : (
                  <Suspense fallback={<div className="text-center py-8">Loading messages...</div>}>
                    {filteredMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isCurrentUser={message.sender_id === currentUser.id}
                        isHighlighted={false}
                      />
                    ))}
                  </Suspense>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Mobile Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value)
                    handleTyping()
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sendingMessage}
                  className="flex-1 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-background"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-6 py-3 rounded-xl hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Todos */}
        <div className={`${activeTab === "todos" ? "block" : "hidden"} w-full bg-card h-full`}>
          <Suspense fallback={<div className="p-4">Loading todos...</div>}>
            <TodoList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default ResponsiveChatApp
