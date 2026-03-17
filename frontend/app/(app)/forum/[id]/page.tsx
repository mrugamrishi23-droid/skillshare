'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ThumbsUp, Eye, ArrowLeft, Send } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { timeAgo, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

export default function ForumPostPage() {
  const { id } = useParams()
  const router = useRouter()
  const qc = useQueryClient()
  const [reply, setReply] = useState('')

  const { data: post, isLoading } = useQuery({
    queryKey: ['forum-post', id],
    queryFn: () => api.get(`/forum/posts/${id}`).then(r => r.data),
  })

  const replyMutation = useMutation({
    mutationFn: () => api.post(`/forum/posts/${id}/replies`, { content: reply }),
    onSuccess: () => {
      toast.success('Reply posted!')
      setReply('')
      qc.invalidateQueries({ queryKey: ['forum-post', id] })
    },
  })

  const upvoteMutation = useMutation({
    mutationFn: () => api.post(`/forum/posts/${id}/upvote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-post', id] }),
  })

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><div className="card p-6 shimmer h-64" /></div>
  if (!post) return null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="btn-ghost text-sm flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Forum
      </button>

      {/* Post */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-3">
          <span style={{ color: post.category.color }}>{post.category.icon} {post.category.name}</span>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {post.views}</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-[var(--text)] mb-4">{post.title}</h1>
        <p className="text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap text-sm">{post.content}</p>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {post.author.avatar_url ? <Image src={post.author.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" /> : post.author.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">{post.author.username}</p>
              <div className="flex gap-1">
                {post.author.badges?.slice(0, 3).map((b: any) => <span key={b.name} className="text-xs">{b.icon}</span>)}
              </div>
            </div>
          </div>
          <button onClick={() => upvoteMutation.mutate()}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
              post.upvoted_by_me ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "btn-secondary py-1.5 px-3")}>
            <ThumbsUp size={14} /> {post.upvotes} upvotes
          </button>
        </div>
      </motion.div>

      {/* Replies */}
      <div>
        <h2 className="font-semibold text-[var(--text)] mb-4">{post.replies?.length || 0} Replies</h2>
        <div className="space-y-4">
          {post.replies?.map((r: any) => (
            <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                {r.author.avatar_url ? <Image src={r.author.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" /> : r.author.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-[var(--text)]">{r.author.username}</span>
                    <span className="text-xs text-[var(--text-muted)]">{timeAgo(r.created_at)}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{r.content}</p>
                </div>
                {/* Nested replies */}
                {r.children?.length > 0 && (
                  <div className="mt-3 ml-4 space-y-3">
                    {r.children.map((child: any) => (
                      <div key={child.id} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {child.author.username?.[0]?.toUpperCase()}
                        </div>
                        <div className="card p-3 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[var(--text)]">{child.author.username}</span>
                            <span className="text-xs text-[var(--text-muted)]">{timeAgo(child.created_at)}</span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">{child.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reply box */}
      <div className="card p-5">
        <h3 className="font-semibold text-sm text-[var(--text)] mb-3">Write a Reply</h3>
        <textarea className="input resize-none text-sm mb-3" rows={4} value={reply}
          onChange={e => setReply(e.target.value)} placeholder="Share your thoughts..." />
        <button onClick={() => replyMutation.mutate()} disabled={!reply.trim() || replyMutation.isPending}
          className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
          <Send size={14} /> Post Reply
        </button>
      </div>
    </div>
  )
}
