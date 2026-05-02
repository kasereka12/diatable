import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const MessageContext = createContext(null)

export function MessageProvider({ children }) {
  const { user } = useAuth()
  const [unreadMessages, setUnreadMessages] = useState(0)

  const fetchUnreadCount = useCallback(async () => {
    if (!supabase || !user) return
    // First get user's conversation IDs
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
    if (!convs || convs.length === 0) { setUnreadMessages(0); return }
    const convIds = convs.map(c => c.id)
    // Then count unread messages in those conversations
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false)
      .in('conversation_id', convIds)
    setUnreadMessages(count || 0)
  }, [user])

  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Realtime: increment on new message not from us
  useEffect(() => {
    if (!supabase || !user) return

    const channel = supabase
      .channel('navbar-unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.new.sender_id !== user.id) {
            setUnreadMessages(prev => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const resetUnread = useCallback(() => {
    setUnreadMessages(0)
  }, [])

  return (
    <MessageContext.Provider value={{ unreadMessages, fetchUnreadCount, resetUnread }}>
      {children}
    </MessageContext.Provider>
  )
}

export function useMessages() {
  const ctx = useContext(MessageContext)
  if (!ctx) throw new Error('useMessages must be used inside MessageProvider')
  return ctx
}
