'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Star, Coins, BookOpen } from 'lucide-react'
import api from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

function LeaderboardRow({ user, rank, metric }: { user: any, rank: number, metric: string }) {
  const { user: me } = useAuthStore()
  const isMe = me?.id === user.id
  const medals = ['🥇', '🥈', '🥉']

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        isMe
          ? "border-brand-500/40 bg-brand-50 dark:bg-brand-500/5"
          : "border-[var(--border)] hover:border-brand-500/20 bg-[var(--bg-card)]"
      )}
    >
      <div className="w-8 text-center">
        {rank <= 3 ? (
          <span className="text-xl">{medals[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold text-[var(--text-muted)]">#{rank}</span>
        )}
      </div>

      <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
        {user.avatar_url ? (
          <Image src={user.avatar_url} alt="" width={40} height={40} className="w-full h-full object-cover" />
        ) : getInitials(user.full_name || user.username)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link href={`/profile/${user.id}`} className="font-semibold text-sm text-[var(--text)] hover:text-brand-500 truncate">
            {user.full_name || user.username}
          </Link>
          {isMe && <span className="badge text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">You</span>}
        </div>
        <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>
      </div>

      <div className="text-right">
        <p className="font-bold text-[var(--text)]">
          {metric === 'sessions_taught' && user.sessions_taught}
          {metric === 'rating' && user.rating.toFixed(1)}
          {metric === 'tokens' && user.tokens.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {metric === 'sessions_taught' && 'sessions'}
          {metric === 'rating' && `${user.rating_count} reviews`}
          {metric === 'tokens' && 'tokens'}
        </p>
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'teachers' | 'rated' | 'tokens'>('teachers')

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.get('/users/leaderboard').then(r => r.data),
  })

  const tabs = [
    { key: 'teachers', label: '👨‍🏫 Top Teachers', icon: BookOpen, users: data?.top_teachers, metric: 'sessions_taught' },
    { key: 'rated', label: '⭐ Top Rated', icon: Star, users: data?.top_rated, metric: 'rating' },
    { key: 'tokens', label: '🪙 Most Tokens', icon: Coins, users: data?.top_tokens, metric: 'tokens' },
  ]

  const activeTab = tabs.find(t => t.key === tab)!

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="page-title mb-2">Leaderboard</h1>
        <p className="text-[var(--text-muted)]">The top contributors in our community</p>
      </div>

      {/* Top 3 podium */}
      {!isLoading && activeTab.users && (
        <div className="flex items-end justify-center gap-4 mb-8 h-40">
          {/* 2nd */}
          {activeTab.users[1] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="flex flex-col items-center gap-2">
              <div className="text-2xl">🥈</div>
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                {activeTab.users[1].avatar_url ? <Image src={activeTab.users[1].avatar_url} alt="" width={56} height={56} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-lg">{activeTab.users[1].username?.[0]?.toUpperCase()}</div>}
              </div>
              <div className="h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-xs font-semibold text-[var(--text-muted)] truncate px-1">{activeTab.users[1].username}</span>
              </div>
            </motion.div>
          )}
          {/* 1st */}
          {activeTab.users[0] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2">
              <div className="text-3xl">🥇</div>
              <div className="w-16 h-16 rounded-full ring-4 ring-yellow-400 overflow-hidden">
                {activeTab.users[0].avatar_url ? <Image src={activeTab.users[0].avatar_url} alt="" width={64} height={64} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-brand-500 flex items-center justify-center font-bold text-xl text-white">{activeTab.users[0].username?.[0]?.toUpperCase()}</div>}
              </div>
              <div className="h-28 w-20 bg-yellow-100 dark:bg-yellow-500/20 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-xs font-semibold text-[var(--text)] truncate px-1">{activeTab.users[0].username}</span>
              </div>
            </motion.div>
          )}
          {/* 3rd */}
          {activeTab.users[2] && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col items-center gap-2">
              <div className="text-2xl">🥉</div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 overflow-hidden">
                {activeTab.users[2].avatar_url ? <Image src={activeTab.users[2].avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{activeTab.users[2].username?.[0]?.toUpperCase()}</div>}
              </div>
              <div className="h-16 w-20 bg-orange-100 dark:bg-orange-500/10 rounded-t-xl flex items-end justify-center pb-2">
                <span className="text-xs font-semibold text-[var(--text-muted)] truncate px-1">{activeTab.users[2].username}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              tab === t.key ? "bg-brand-500 text-white shadow-sm" : "btn-secondary py-2 px-4")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <div key={i} className="rounded-xl border border-[var(--border)] p-4 shimmer h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab.users?.map((u: any, i: number) => (
            <LeaderboardRow key={u.id} user={u} rank={i + 1} metric={activeTab.metric} />
          ))}
        </div>
      )}
    </div>
  )
}
