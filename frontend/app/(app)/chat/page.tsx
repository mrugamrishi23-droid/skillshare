'use client'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageSquare, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { timeAgo, getInitials, cn } from '@/lib/utils'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function ChatPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const searchParams = useSearchParams()
  const initialUserId = searchParams.get('user')
  const initialConvId = searchParams.get('conv')
  const [activeConv, setActiveConv] = useState<number | null>(null)
  const [activeUser, setActiveUser] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: convData, refetch: refetchConvs } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/chat/conversations').then(r => r.data),
    refetchInterval: 10000,
  })

  const { data: msgData, refetch: refetchMsgs } = useQuery({
    queryKey: ['messages', activeConv],
    queryFn: () => api.get(`/chat/conversations/${activeConv}/messages`).then(r => r.data),
    enabled: !!activeConv && activeConv > 0,
    refetchInterval: 5000,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post('/chat/send', {
      recipient_id: activeUser?.id,
      content
    }),
    onSuccess: () => {
      setMessage('')
      refetchMsgs()
      refetchConvs()
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to send message'),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgData])

  // Auto-open from notification conv link (?conv=ID)
  // Auto-open from user link (?user=ID)
  useEffect(() => {
    if (!convData?.conversations) return

    // Priority 1: open by conversation ID (from notification)
    if (initialConvId) {
      const conv = convData.conversations.find((c: any) => c.id === Number(initialConvId))
      if (conv) {
        setActiveConv(conv.id)
        setActiveUser(conv.other_user)
        return
      }
    }

    // Priority 2: open by user ID (from match/profile page)
    if (initialUserId) {
      const conv = convData.conversations.find((c: any) => c.other_user.id === Number(initialUserId))
      if (conv) {
        setActiveConv(conv.id)
        setActiveUser(conv.other_user)
      } else {
        // No existing conversation — load user to start a new one
        api.get(`/users/${initialUserId}`).then(r => {
          setActiveUser(r.data)
          setActiveConv(-1)
        })
      }
    }
  }, [initialUserId, initialConvId, convData])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeUser) return
    sendMutation.mutate(message.trim())
  }

  const handleConvClick = (conv: any) => {
    setActiveConv(conv.id)
    setActiveUser(conv.other_user)
  }

  const conversations = convData?.conversations?.filter((c: any) => {
    if (!search) return true
    return c.other_user.username.toLowerCase().includes(search.toLowerCase())
  }) || []

  const messages = msgData?.messages || []

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 61px)' }}>

      {/* Sidebar */}
      <div className={cn(
        "w-full sm:w-80 flex-shrink-0 border-r border-[var(--border)] flex flex-col bg-[var(--bg-card)]",
        activeConv ? "hidden sm:flex" : "flex"
      )}>
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text)] mb-3">Messages</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input pl-9 text-sm py-2" placeholder="Search..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <div className="p-6 text-center">
              <MessageSquare size={32} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
              <p className="text-sm text-[var(--text-muted)]">No conversations yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Find a match and start chatting!</p>
            </div>
          )}
          {conversations.map((conv: any) => (
            <button key={conv.id} onClick={() => handleConvClick(conv)}
              className={cn(
                "w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-[#1e1e2e] transition-colors text-left border-b border-[var(--border)]",
                activeConv === conv.id && "bg-brand-50 dark:bg-brand-500/5"
              )}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                  {conv.other_user.avatar_url ? (
                    <Image src={conv.other_user.avatar_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  ) : getInitials(conv.other_user.full_name || conv.other_user.username)}
                </div>
                {conv.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={cn("text-sm truncate",
                    conv.unread_count > 0 ? "font-semibold text-[var(--text)]" : "font-medium text-[var(--text)]")}>
                    {conv.other_user.full_name || conv.other_user.username}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] flex-shrink-0 ml-2">
                    {conv.last_message.created_at ? timeAgo(conv.last_message.created_at) : ''}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                  {conv.last_message.sender_id === user?.id ? 'You: ' : ''}{conv.last_message.content || 'Start chatting...'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className={cn("flex-1 flex flex-col", !activeConv && !activeUser && "hidden sm:flex")}>
        {!activeConv && !activeUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Select a conversation</h3>
              <p className="text-sm text-[var(--text-muted)]">Choose from your conversations or find a match</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] bg-[var(--bg-card)]">
              <button onClick={() => { setActiveConv(null); setActiveUser(null) }}
                className="sm:hidden btn-ghost p-1.5 text-[var(--text)]">
                ← Back
              </button>
              <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {activeUser?.avatar_url ? (
                  <Image src={activeUser.avatar_url} alt="" width={36} height={36} className="w-full h-full object-cover" />
                ) : getInitials(activeUser?.full_name || activeUser?.username)}
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--text)]">{activeUser?.full_name || activeUser?.username}</p>
                <p className="text-xs text-[var(--text-muted)]">@{activeUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-[var(--text-muted)]">
                    {activeConv === -1
                      ? "Send a message to start the conversation!"
                      : "No messages yet — say hello!"}
                  </p>
                </div>
              )}
              {messages.map((msg: any) => {
                const isMe = msg.sender_id === user?.id
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs mr-2 flex-shrink-0 self-end overflow-hidden">
                        {msg.sender_avatar
                          ? <Image src={msg.sender_avatar} alt="" width={28} height={28} className="w-full h-full object-cover" />
                          : msg.sender_username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2.5 rounded-2xl text-sm",
                      isMe
                        ? "bg-brand-500 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-[#2a2a3a] text-[var(--text)] rounded-bl-sm"
                    )}>
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={cn("text-[10px] mt-1", isMe ? "text-white/60" : "text-[var(--text-muted)]")}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </motion.div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
              <div className="flex gap-2">
                <input className="input flex-1 text-sm" placeholder="Type a message..."
                  value={message} onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any) } }} />
                <button type="submit" disabled={!message.trim() || sendMutation.isPending}
                  className="btn-primary px-4 py-2.5">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}