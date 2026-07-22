import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface MessageContextValue {
  unreadMessages:   number
  fetchUnreadCount: () => Promise<void>
  resetUnread:      () => void
}

const MessageContext = createContext<MessageContextValue | null>(null)

export function MessageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
    if (!convs || convs.length === 0) { setUnreadMessages(0); return }
    const convIds = (convs as Array<{ id: string }>).map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false)
      .in('conversation_id', convIds)
    setUnreadMessages(count || 0)
  }, [user])

  useEffect(() => { fetchUnreadCount() }, [fetchUnreadCount])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('navbar-unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as { sender_id: string }
          if (msg.sender_id !== user.id) setUnreadMessages(prev => prev + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  const resetUnread = useCallback(() => { setUnreadMessages(0) }, [])

  return (
    <MessageContext.Provider value={{ unreadMessages, fetchUnreadCount, resetUnread }}>
      {children}
    </MessageContext.Provider>
  )
}

export function useMessages(): MessageContextValue {
  const ctx = useContext(MessageContext)
  if (!ctx) throw new Error('useMessages must be used inside MessageProvider')
  return ctx
}
