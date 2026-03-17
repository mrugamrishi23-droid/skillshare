'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, BookOpen, Star, Coins, Flame, ArrowRight, Clock, Users, TrendingUp, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, timeAgo, cn } from '@/lib/utils'
import Image from 'next/image'

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-2`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-display font-bold text-[var(--text)]">{value}</p>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: sessions } = useQuery({
    queryKey: ['upcoming-sessions'],
    queryFn: () => api.get('/sessions/upcoming').then(r => r.data),
  })

  const { data: suggestions } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => api.get('/matching/suggestions').then(r => r.data),
  })

  const { data: tokenHistory } = useQuery({
    queryKey: ['token-history'],
    queryFn: () => api.get('/gamification/tokens/history').then(r => r.data),
  })

  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/gamification/badges').then(r => r.data),
  })

  if (!user) return null

  const stats = [
    { icon: BookOpen, label: 'Sessions Taught', value: user.sessions_taught, color: 'bg-brand-500', sub: 'lifetime' },
    { icon: TrendingUp, label: 'Sessions Learned', value: user.sessions_learned, color: 'bg-purple-500', sub: 'lifetime' },
    { icon: Coins, label: 'SkillTokens', value: user.tokens, color: 'bg-yellow-500', sub: 'balance' },
    { icon: Flame, label: 'Login Streak', value: `${(user.login_streak ?? 0)}d`, color: 'bg-orange-500', sub: 'keep it up!' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user.full_name?.split(' ')[0] || user.username}</span> ðŸ‘‹
          </h1>
          <p className="text-[var(--text-muted)] mt-1">Here's what's happening with your skill journey.</p>
        </div>
        <Link href="/matching" className="btn-primary flex items-center gap-2 text-sm">
          <Users size={16} /> Find Matches
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title text-lg">Upcoming Sessions</h2>
            <Link href="/sessions" className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {sessions?.sessions?.length === 0 ? (
            <div className="text-center py-10">
              <Calendar size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-30" />
              <p className="text-[var(--text-muted)] text-sm">No upcoming sessions</p>
              <Link href="/matching" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                Find a Match <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions?.sessions?.map((s: any) => (
                <Link key={s.id} href={`/sessions/${s.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] hover:border-brand-500/30 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: s.skill?.color || '#6366f1' }}>
                    {s.skill?.name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[var(--text)] truncate">{s.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      with {user.id === s.teacher.id ? s.student.username : s.teacher.username}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--text-muted)]">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {s.scheduled_at ? formatDateTime(s.scheduled_at) : 'TBD'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Badges */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-[var(--text)]">Your Badges</h2>
              <span className="text-xs text-[var(--text-muted)]">{badges?.earned?.length || 0} earned</span>
            </div>
            {badges?.earned?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-[var(--text-muted)]">Complete sessions to earn badges!</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges?.earned?.map((b: any) => (
                  <div key={b.id} title={b.description}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2"
                    style={{ borderColor: b.color + '40', background: b.color + '15' }}>
                    {b.icon}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skills summary */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm text-[var(--text)] mb-3">My Skills</h2>
            {(user.skills_can_teach?.length ?? 0) === 0 && (user.skills_want_to_learn?.length ?? 0) === 0 ? (
              <div className="text-center py-3">
                <p className="text-xs text-[var(--text-muted)] mb-3">Add skills to get matched!</p>
                <Link href="/profile" className="btn-primary text-xs py-1.5 px-3 inline-block">
                  Set up profile
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {(user.skills_can_teach?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1.5">Can teach</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.skills_can_teach ?? []).slice(0, 4).map(s => (
                        <span key={s.id} className="skill-chip" style={{ background: s.color + '20', color: s.color }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(user.skills_want_to_learn?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1.5">Want to learn</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(user.skills_want_to_learn ?? []).slice(0, 4).map(s => (
                        <span key={s.id} className="skill-chip">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent tokens */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm text-[var(--text)] mb-3">Recent Tokens</h2>
            <div className="space-y-2">
              {tokenHistory?.transactions?.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)] truncate flex-1">{t.reason}</span>
                  <span className={cn("font-semibold ml-2", t.type === 'earned' ? 'text-emerald-500' : 'text-red-400')}>
                    {t.type === 'earned' ? '+' : '-'}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Matches */}
      {suggestions?.suggestions?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Suggested Matches</h2>
            <Link href="/matching" className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {suggestions.suggestions.map((match: any, i: number) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
              >
                <Link href={`/profile/${match.id}`} className="card-hover p-4 block">
                  <div className="text-center mb-3">
                    <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-brand-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                      {match.avatar_url ? (
                        <Image src={match.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        match.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <p className="font-medium text-sm text-[var(--text)] truncate">{match.username}</p>
                    <div className="inline-flex items-center gap-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs px-2 py-0.5 rounded-full mt-1">
                      {match.match_score}% match
                    </div>
                  </div>
                  {match.skill_overlap?.slice(0, 2).map((s: any) => (
                    <div key={s.skill} className="text-xs text-center text-[var(--text-muted)] truncate">
                      {s.direction === 'you_teach' ? 'ðŸ“¤' : 'ðŸ“¥'} {s.skill}
                    </div>
                  ))}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


