/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react"
import { supabase } from "@/utils/supabase"
import { Search, LogOut, X, MessageSquare, Users, CheckSquare, Send, ArrowLeft } from "lucide-react"
import { CohereClient } from "cohere-ai"
import useDebounce from "@/hooks/useDebounce"

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
}

export default function ResponsiveChatApp() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [todoWidth, setTodoWidth] = useState(320)
  const minTodoWidth = 240
  const maxTodoWidth = 600
  const sidebarRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  
  // Memoized user data calculations
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

  // Debounced search terms
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const debouncedChatSearchTerm = useDebounce(chatSearchTerm, 300)

  // Filter users with memoization
  const filteredUsers = useMemo(() => {
    return users.filter((user) => getDisplayName(user).toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  }, [users, debouncedSearchTerm, getDisplayName])

  // Filter messages based on chat search term
  const filteredMessages = useMemo(() => {
    if (!debouncedChatSearchTerm) return messages
    return messages.filter((message) => message.content.toLowerCase().includes(debouncedChatSearchTerm.toLowerCase()))
  }, [messages, debouncedChatSearchTerm])

  // Real-time message subscription
  useEffect(() => {
    if (!currentUser) return

    const messagesSubscription = supabase
      .channel("all_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message

          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev
              return [...prev, newMessage]
            })

            if (selectedUser?.id === newMessage.sender_id) {
              markMessagesAsRead(newMessage.sender_id)
            }
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((m) => (m.id === newMessage.id ? newMessage : m)))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesSubscription)
    }
  }, [currentUser, selectedUser])

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true)
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        
        if (session?.user) {
          const user = session.user
          const userData = {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          }

          const [_, profilesResult] = await Promise.all([
            // Get Google token (placeholder for future implementation)
            Promise.resolve(null),
            supabase.from("profiles").select("*").neq("id", user.id)
          ])

          if (profilesResult.error) throw profilesResult.error
          
          setCurrentUser(userData)
          setUsers(profilesResult.data || [])
        }
      } catch (error: any) {
        console.error("Initialization error:", error)
        if (error?.message?.includes('auth') || error?.message?.includes('session')) {
          console.log("Authentication issue detected")
        }
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user
        const userData = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
          full_name: user.user_metadata?.full_name,
          avatar_url: user.user_metadata?.avatar_url,
        }
        
        setCurrentUser(userData)
        
        try {
          const { data: profiles, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .neq("id", user.id)
          
          if (!profileError) {
            setUsers(profiles || [])
          }
        } catch (error) {
          console.error("Error loading users after sign in:", error)
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        setUsers([])
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Load users with pagination
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

  // Load messages with correct ordering
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

  // Mark messages as read
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

  // Message subscription for selected user
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
            if (prev.some((msg) => msg.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })

          if (newMessage.sender_id === selectedUser.id) {
            markMessagesAsRead(newMessage.sender_id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, selectedUser, markMessagesAsRead])

  // Typing indicator subscription
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

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      setMessages([])
      loadMessages(selectedUser.id)
      markMessagesAsRead(selectedUser.id)
      setShowMobileChat(true)
    }
  }, [selectedUser, currentUser, loadMessages, markMessagesAsRead])

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [filteredMessages])

  // Handle typing indicator
  const handleTyping = useCallback(async () => {
    if (!selectedUser || !currentUser) return

    const typingChannel = supabase.channel(`typing:${currentUser.id}:${selectedUser.id}`)
    await typingChannel.subscribe()
    typingChannel.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser.id },
    })
  }, [selectedUser, currentUser])

  // Fixed message sending function
  const sendMessage = useCallback(async () => {
    const messageContent = newMessage.trim()
    if (!messageContent || !selectedUser || !currentUser || sendingMessage) return

    setSendingMessage(true)
    const tempId = `temp_${Date.now()}_${Math.random()}`

    const optimisticMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      is_read: false,
      is_calendar_event: true,
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
          is_calendar_event: true,
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...data, is_read: false } : msg)))
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setNewMessage(messageContent)
    } finally {
      setSendingMessage(false)
    }
  }, [newMessage, selectedUser, currentUser, sendingMessage])

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const newWidth = window.innerWidth - e.clientX
      setTodoWidth(Math.max(minTodoWidth, Math.min(maxTodoWidth, newWidth)))
    }
    const handleMouseUp = () => {
      isResizing.current = false
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-blue-600 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h1>
          <p className="text-slate-600 mb-6">Please sign in to access your chat workspace</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 xl:overflow-y-hidden overflow-hidden">
      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showMobileChat && selectedUser ? (
              <button onClick={handleBackToChats} className="p-1 text-slate-600 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">{getInitials(currentUser)}</span>
              </div>
            )}
            <h1 className="text-lg font-semibold text-slate-800">
              {showMobileChat && selectedUser ? getDisplayName(selectedUser) : "Chat App"}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {!showMobileChat && (
              <>
                <button
                  onClick={() => setActiveTab("chats")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === "chats" ? "bg-blue-100 text-blue-600" : "text-slate-600"
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveTab("todos")}
                  className={`p-2 rounded-lg transition-colors ${
                    activeTab === "todos" ? "bg-blue-100 text-blue-600" : "text-slate-600"
                  }`}
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              </>
            )}
            <button onClick={handleSignOut} className="p-2 text-slate-600 hover:text-slate-800 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Left Sidebar - Chats */}
      <div
        className={`${
          showMobileChat ? "hidden" : activeTab === "chats" ? "block" : "hidden"
        } lg:block w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col pt-16 lg:pt-0 h-full`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-800">Messages</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {loadingUsers ? (
            <div className="p-6 text-center">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-500">Loading conversations...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">
                {debouncedSearchTerm ? "No matching users found" : "No conversations yet"}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {debouncedSearchTerm ? "Try a different search term" : "Start a new conversation"}
              </p>
            </div>
          ) : (
            <Suspense fallback={<div className="p-6 text-center">Loading users...</div>}>
              {filteredUsers.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  currentUser={currentUser}
                  messages={messages}
                  isSelected={selectedUser?.id === user.id}
                  onClick={() => {
                    setSelectedUser(user)
                    setActiveTab("chats")
                  }}
                  getInitials={getInitials}
                  getDisplayName={getDisplayName}
                />
              ))}
            </Suspense>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                <span className="text-white font-medium">{getInitials(currentUser)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">{getDisplayName(currentUser)}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Center - Chat Area */}
      <div
        className={`${
          showMobileChat || (!showMobileChat && activeTab === "chats") ? "block" : "hidden"
        } lg:block flex-1 bg-white pt-16 lg:pt-0 h-screen flex flex-col`}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 lg:p-6 border-b border-slate-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md">
                    <span className="text-white font-medium">{getInitials(selectedUser)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{getDisplayName(selectedUser)}</p>
                    {typingUsers.has(selectedUser.id) && (
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-600 ml-2">typing...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative w-64 hidden lg:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={chatSearchTerm}
                    onChange={(e) => setChatSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {chatSearchTerm && (
                    <button
                      onClick={clearChatSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <div
                ref={messagesContainerRef}
                className="h-full overflow-y-auto p-4 lg:p-6 space-y-4 bg-gradient-to-b from-slate-50/50 to-white"
              >
                {loadingMessages && messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-500">Loading messages...</p>
                  </div>
                ) : (
                  <>
                    {filteredMessages.length === 0 && chatSearchTerm ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No messages found</p>
                        <p className="text-slate-400 text-sm">Try searching for something else</p>
                      </div>
                    ) : filteredMessages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Start your conversation</p>
                        <p className="text-slate-400 text-sm">Send a message to get started</p>
                      </div>
                    ) : (
                      <Suspense fallback={<div className="text-center py-8">Loading messages...</div>}>
                        {filteredMessages.map((message) => (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isCurrentUser={message.sender_id === currentUser.id}
                            isHighlighted={
                              chatSearchTerm.length > 0 &&
                              message.content.toLowerCase().includes(chatSearchTerm.toLowerCase())
                            }
                          />
                        ))}
                      </Suspense>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 lg:p-6 border-t border-slate-200 bg-white flex-shrink-0">
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
                  className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg flex items-center justify-center"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center">Loading...</div>}>
            <EmptyChatState />
          </Suspense>
        )}
      </div>

      {/* Right Sidebar - Todos */}
      <div
        ref={sidebarRef}
        style={{ width: todoWidth, minWidth: minTodoWidth, maxWidth: maxTodoWidth }}
        className={`${
          activeTab === "todos" ? "block" : "hidden"
        } lg:block border-l border-slate-200 bg-white pt-16 lg:pt-0 h-full relative transition-all duration-200`}
      >
        {/* Drag handle */}
        <div
          className="absolute left-0 top-0 h-full w-2 cursor-ew-resize z-50"
          onMouseDown={() => { isResizing.current = true }}
          style={{ background: "rgba(0,0,0,0.01)" }}
          title="Drag to resize"
        />
        <Suspense fallback={<div className="p-4">Loading todos...</div>}>
          <TodoList />
        </Suspense>
      </div>
    </div>
  )
}

 