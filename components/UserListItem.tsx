import React, { useMemo } from 'react'
import { ChatUser, Message } from "../types"

interface UserListItemProps {
  user: ChatUser
  currentUser: ChatUser
  messages: Message[]
  isSelected: boolean
  onClick: () => void
  getInitials: (user: ChatUser) => string
  getDisplayName: (user: ChatUser) => string
}

const UserListItem = React.memo(function UserListItem({
  user,
  currentUser,
  messages,
  isSelected,
  onClick,
  getInitials,
  getDisplayName,
}: UserListItemProps) {
  const { lastMessage, unreadCount } = useMemo(() => {
    const userMessages = messages.filter(
      (m) =>
        (m.sender_id === user.id && m.receiver_id === currentUser.id) ||
        (m.sender_id === currentUser.id && m.receiver_id === user.id)
    )
    return {
      lastMessage: userMessages.length > 0 
        ? userMessages[userMessages.length - 1].content 
        : "Start a conversation",
      unreadCount: messages.filter((m) => 
        m.sender_id === user.id && 
        m.receiver_id === currentUser.id && 
        !m.is_read
      ).length
    }
  }, [messages, user.id, currentUser.id])

  return (
    <div
      onClick={onClick}
      className={`flex items-center p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-slate-50 ${
        isSelected ? "bg-blue-50 border-blue-200" : ""
      }`}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-md">
        <span className="text-white font-medium">{getInitials(user)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-slate-800 truncate">{getDisplayName(user)}</p>
          {unreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 truncate mt-1">{lastMessage}</p>
      </div>
    </div>
  )
})

export default UserListItem