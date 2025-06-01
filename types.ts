export interface ChatUser {
    id: string
    username?: string
    full_name?: string
    avatar_url?: string
    updated_at?: string
  }
  
  export interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    created_at: string
    is_read?: boolean
    is_calendar_event?: boolean
  }