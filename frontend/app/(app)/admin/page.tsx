'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, MessageCircle, BarChart3, Shield, Ban, Check, Trash, Search } from 'lucide-react'
import api from '@/lib/api'
import { timeAgo, cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview' | 'users' | 'posts'>('overview')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user && user.role === 'user') router.push('/dashboard')
  }, [user])

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  })

  const { data: usersData } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get('/admin/users', { params: { search, limit: 50 } }).then(r => r.data),
    enabled: tab === 'users',
  })

  const { data: postsData } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => api.get('/forum/posts', { params: { limit: 50 } }).then(r => r.data),
    enabled: tab === 'posts',
  })

  const banMutation = useMutation({
    mutationFn: (userId: number) => api.put(`/admin/users/${userId}/ban`),
    onSuccess: () => { toast.success('User status updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => api.delete(`/admin/posts/${postId}`),
    onSuccess: () => { toast.success('Post deleted'); qc.invalidateQueries({ queryKey: ['admin-posts'] }) },
  })

  const flagPostMutation = useMutation({
    mutationFn: (postId: number) => api.put(`/admin/posts/${postId}/flag`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-posts'] }),
  })

  const statsCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-brand-500' },
    { label: 'Active Users', value: stats?.active_users || 0, icon: Check, color: 'bg-emerald-500' },
    { label: 'Total Sessions', value: stats?.total_sessions || 0, icon: BarChart3, color: 'bg-purple-500' },
    { label: 'Completed Sessions', value: stats?.completed_sessions || 0, icon: Check, color: 'bg-blue-500' },
    { label: 'Forum Posts', value: stats?.total_posts || 0, icon: MessageCircle, color: 'bg-yellow-500' },
    { label: 'Flagged Posts', value: stats?.flagged_posts || 0, icon: Shield, color: 'bg-red-500' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-brand-500" />
        <h1 className="page-title">Admin Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ key: 'overview', label: '📊 Overview' }, { key: 'users', label: '👥 Users' }, { key: 'posts', label: '📝 Posts' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all",
              tab === t.key ? "bg-brand-500 text-white" : "btn-secondary py-2 px-4")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statsCards.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="card p-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.color)}>
                <s.icon size={20} className="text-white" />
              </div>
              <p className="text-2xl font-display font-bold text-[var(--text)]">{s.value.toLocaleString()}</p>
              <p className="text-sm text-[var(--text-muted)]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input className="input pl-10 text-sm" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-[#1e1e2e]">
                <tr>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">Role</th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">Sessions</th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">Tokens</th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {usersData?.users?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-[#1e1e2e] transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-[var(--text)]">{u.username}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn("badge text-xs", u.role === 'admin' ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--text-muted)]">{u.sessions_taught}</td>
                    <td className="p-4 text-[var(--text-muted)]">{u.tokens}</td>
                    <td className="p-4">
                      <span className={cn("badge text-xs", u.is_banned ? "bg-red-100 dark:bg-red-500/10 text-red-600" : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600")}>
                        {u.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => banMutation.mutate(u.id)}
                        className={cn("text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors",
                          u.is_banned ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-200" : "bg-red-100 dark:bg-red-500/10 text-red-600 hover:bg-red-200")}>
                        {u.is_banned ? '✓ Unban' : '🚫 Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'posts' && (
        <div className="space-y-3">
          {postsData?.posts?.map((post: any) => (
            <div key={post.id} className={cn("card p-4", post.is_flagged && "border-red-300 dark:border-red-700")}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {post.is_flagged && <span className="badge bg-red-100 dark:bg-red-500/10 text-red-600 text-xs">🚩 Flagged</span>}
                    <p className="font-medium text-sm text-[var(--text)] truncate">{post.title}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">by {post.author.username} · {timeAgo(post.created_at)}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-1">{post.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => flagPostMutation.mutate(post.id)}
                    className="btn-secondary text-xs py-1.5 px-2.5">
                    {post.is_flagged ? 'Unflag' : '🚩 Flag'}
                  </button>
                  <button onClick={() => { if (confirm('Delete post?')) deletePostMutation.mutate(post.id) }}
                    className="bg-red-50 dark:bg-red-500/10 text-red-600 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
