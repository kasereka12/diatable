import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  MessageCircle, Send, ArrowLeft, Search, User, Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Hier'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const { user, profile } = useAuth()
  const isVendor = profile?.role === 'vendor'

  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch conversations
  useEffect(() => {
    if (!supabase || !user) { setLoading(false); return }

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          restaurant:restaurants(name, cuisine_label, flag),
          customer:profiles!conversations_customer_id_fkey(full_name),
          vendor:profiles!conversations_vendor_id_fkey(full_name)
        `)
        .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      setConversations(data || [])
      setLoading(false)
    }
    load()
  }, [user])

  // Fetch messages for active conversation
  const loadMessages = useCallback(async (convId) => {
    if (!supabase || !convId) return
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(full_name)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark unread messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id)
      .eq('is_read', false)
  }, [user])

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
    }
  }, [activeConv, loadMessages])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Realtime subscription for new messages
  useEffect(() => {
    if (!supabase || !activeConv) return

    const channel = supabase
      .channel('chat-' + activeConv.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConv.id}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
          // Mark as read if not from us
          if (payload.new.sender_id !== user.id) {
            supabase.from('messages')
              .update({ is_read: true })
              .eq('id', payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeConv, user])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || !supabase) return

    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: newMessage.trim(),
    })

    setNewMessage('')
    setSending(false)
  }

  const filtered = conversations.filter(c => {
    if (!search) return true
    const name = isVendor ? c.customer?.full_name : c.restaurant?.name
    return (name || '').toLowerCase().includes(search.toLowerCase())
  })

  const getConvName = (conv) => {
    if (isVendor) return conv.customer?.full_name || 'Client'
    return conv.restaurant?.name || 'Restaurant'
  }

  const getConvInitials = (conv) => {
    const name = getConvName(conv)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="bg-cream min-h-screen pt-24">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link to={isVendor ? '/tableau-de-bord' : '/profil'} className="text-muted text-sm hover:text-dark transition-colors flex items-center gap-1 mb-3">
            <ArrowLeft size={16} /> Retour
          </Link>
          <h1 className="font-serif text-3xl font-bold text-dark flex items-center gap-3">
            <MessageCircle size={28} className="text-gold" />
            Messages
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.05] overflow-hidden" style={{ height: 'calc(100vh - 240px)', minHeight: '500px' }}>
          <div className="flex h-full">
            {/* Sidebar: conversation list */}
            <div className={`w-80 border-r border-black/[0.06] flex flex-col flex-shrink-0 ${activeConv ? 'hidden md:flex' : 'flex w-full md:w-80'}`}>
              <div className="p-4 border-b border-black/[0.06]">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-cream border border-black/[0.06] text-sm text-dark focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12 text-muted text-sm">Chargement...</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle size={36} className="text-muted/30 mx-auto mb-3" />
                    <p className="text-muted text-sm">Aucune conversation</p>
                    <p className="text-muted/60 text-xs mt-1">
                      {isVendor
                        ? "Vos clients vous contacteront ici"
                        : "Envoyez un message depuis la page d'un restaurant"}
                    </p>
                  </div>
                ) : (
                  filtered.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:bg-cream/50 ${
                        activeConv?.id === conv.id ? 'bg-gold/10 border-l-2 border-gold' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-dark text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
                        {getConvInitials(conv)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-dark truncate">{getConvName(conv)}</p>
                          <span className="text-[0.65rem] text-muted flex-shrink-0 ml-2">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        </div>
                        {!isVendor && conv.restaurant && (
                          <p className="text-[0.65rem] text-muted">{conv.restaurant.flag} {conv.restaurant.cuisine_label}</p>
                        )}
                        <p className="text-xs text-muted truncate mt-0.5">{conv.last_message || 'Nouvelle conversation'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Main: chat area */}
            <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex-1 flex items-center justify-center text-center px-6">
                  <div>
                    <MessageCircle size={48} className="text-muted/20 mx-auto mb-4" />
                    <p className="font-serif text-lg font-bold text-dark mb-1">Sélectionnez une conversation</p>
                    <p className="text-muted text-sm">Choisissez une conversation dans la liste</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-black/[0.06] bg-white">
                    <button
                      onClick={() => setActiveConv(null)}
                      className="md:hidden p-1 rounded-lg hover:bg-cream"
                      aria-label="Retour aux conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-dark text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#f4a828,#c8841a)' }}>
                      {getConvInitials(activeConv)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">{getConvName(activeConv)}</p>
                      {activeConv.restaurant && (
                        <p className="text-xs text-muted">{activeConv.restaurant.flag} {activeConv.restaurant.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-cream/30">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-muted text-sm">Démarrez la conversation</p>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user.id
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? 'bg-gold text-dark rounded-br-md'
                              : 'bg-white text-dark border border-black/[0.06] rounded-bl-md'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-[0.6rem] mt-1 ${isMe ? 'text-dark/50' : 'text-muted'}`}>
                              {timeAgo(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t border-black/[0.06] bg-white">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Écrire un message..."
                      className="flex-1 border border-black/[0.08] rounded-xl px-4 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-gold/50 bg-cream"
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="btn btn-gold px-4 py-2.5 disabled:opacity-50"
                      aria-label="Envoyer"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
