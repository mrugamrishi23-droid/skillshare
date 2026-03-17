'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ThumbsUp, Eye, Plus, ArrowRight, X, Pin } from 'lucide-react'
import api from '@/lib/api'
import { timeAgo, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'

function NewPostModal({ categories, onClose }: { categories: any[], onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [catId, setCatId] = useState(categories[0]?.id || 0)
  const qc = useQueryClient()

  const createMutation = useMutation({
    mutationFn: () => api.post('/forum/posts', { category_id: catId, title, content }),
    onSuccess: () => { toast.success('Post created!'); qc.invalidateQueries({ queryKey: ['forum-posts'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-[var(--text)]">Create Post</h3>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select className="input text-sm" value={catId} onChange={e => setCatId(Number(e.target.value))}>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input className="input text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="What's on your mind?" />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input text-sm resize-none" rows={5} value={content} onChange={e => setContent(e.target.value)} placeholder="Share your thoughts, tips, or questions..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => createMutation.mutate()} disabled={!title || !content || createMutation.isPending}
              className="btn-primary flex-1 text-sm py-2.5">
              Post
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function ForumPage() {
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState<number | null>(null)
  const [sort, setSort] = useState('recent')
  const [showNewPost, setShowNewPost] = useState(false)

  const { data: cats } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => api.get('/forum/categories').then(r => r.data),
  })

  const { data: posts, isLoading } = useQuery({
    queryKey: ['forum-posts', selectedCat, sort],
    queryFn: () => api.get('/forum/posts', { params: { category_id: selectedCat, sort, limit: 30 } }).then(r => r.data),
  })

  const upvoteMutation = useMutation({
    mutationFn: (postId: number) => api.post(`/forum/posts/${postId}/upvote`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['forum-posts'] }),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title mb-1">Community Forum</h1>
          <p className="text-[var(--text-muted)]">Share tips, ask questions, connect with learners</p>
        </div>
        <button onClick={() => setShowNewPost(true)} className="btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> New Post
        </button>
      </div>

      <div className="flex gap-6">
        {/* Categories sidebar */}
        <div className="hidden lg:block w-56 flex-shrink-0 space-y-1">
          <button onClick={() => setSelectedCat(null)}
            className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              !selectedCat ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-100 dark:hover:bg-[#2a2a3a]")}>
            📋 All Posts
          </button>
          {cats?.map((c: any) => (
            <button key={c.id} onClick={() => setSelectedCat(c.id)}
              className={cn("w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                selectedCat === c.id ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-slate-100 dark:hover:bg-[#2a2a3a]")}>
              {c.icon} {c.name}
              <span className="float-right text-xs text-[var(--text-muted)]">{c.post_count}</span>
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="flex-1 min-w-0">
          {/* Sort */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {[{ value: 'recent', label: '🕐 Recent' }, { value: 'popular', label: '🔥 Popular' }].map(s => (
              <button key={s.value} onClick={() => setSort(s.value)}
                className={cn("px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap",
                  sort === s.value ? "bg-brand-500 text-white" : "btn-secondary py-1.5 px-3 text-sm")}>
                {s.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="card p-5 shimmer h-24" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {posts?.posts?.map((post: any) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="card p-5 hover:border-brand-500/20 transition-colors">
                  <div className="flex gap-4">
                    {/* Vote */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <button onClick={() => upvoteMutation.mutate(post.id)}
                        className={cn("flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-colors",
                          post.upvoted_by_me ? "text-brand-500" : "text-[var(--text-muted)] hover:text-brand-500")}>
                        <ThumbsUp size={16} />
                        <span className="text-xs font-semibold">{post.upvotes}</span>
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap mb-1">
                        {post.is_pinned && <Pin size={14} className="text-brand-500 flex-shrink-0 mt-0.5" />}
                        <Link href={`/forum/${post.id}`} className="font-semibold text-[var(--text)] hover:text-brand-500 transition-colors leading-snug">
                          {post.title}
                        </Link>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                            {post.author.avatar_url ? <Image src={post.author.avatar_url} alt="" width={20} height={20} className="w-full h-full object-cover" /> : post.author.username?.[0]?.toUpperCase()}
                          </div>
                          {post.author.username}
                        </div>
                        <span>in</span>
                        <span style={{ color: post.category.color }}>{post.category.icon} {post.category.name}</span>
                        <span>·</span>
                        <span>{timeAgo(post.created_at)}</span>
                      </div>

                      <p className="text-sm text-[var(--text-muted)] line-clamp-2">{post.content}</p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.reply_count} replies</span>
                        <span className="flex items-center gap-1"><Eye size={12} /> {post.views}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewPost && cats && (
        <NewPostModal categories={cats} onClose={() => setShowNewPost(false)} />
      )}
    </div>
  )
}
