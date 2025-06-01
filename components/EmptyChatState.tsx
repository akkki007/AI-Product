import React from 'react'
import { MessageSquare } from 'lucide-react'

const EmptyChatState = React.memo(function EmptyChatState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-slate-50/50 to-white">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <MessageSquare className="text-blue-600 w-10 h-10" />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Welcome to your workspace</h3>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Select a conversation from the sidebar to start messaging, or check your tasks in the todo panel.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Real-time messaging</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default EmptyChatState