'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, MapPin, Star, Users, MessageSquare, Filter } from 'lucide-react'
import api from '@/lib/api'
import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'

function MatchCard({ match }: { match: any }) {
  const score = match.match_score
  const scoreColor = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-brand-500' : score >= 40 ? 'text-yellow-500' : 'text-slate-400'
  const scoreBg = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-brand-500' : score >= 40 ? 'bg-yellow-500' : 'bg-slate-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="card p-5 hover:shadow-lg transition-all duration-200"
    >
      {/* Match score bar */}
      <div className="flex items-center justify-between mb-4">
        <div className={cn('text-xs font-bold px-2.5 py-1 rounded-full', scoreColor, 'bg-current/10')}>
          {score}% match
        </div>
        <div className="flex gap-1">
          {match.badges?.slice(0, 3).map((b: any) => (
            <span key={b.name} title={b.name} className="text-sm">{b.icon}</span>
          ))}
        </div>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-500 flex items-center justify-center text-white font-bold">
            {match.avatar_url ? (
              <Image src={match.avatar_url} alt="" width={48} height={48} className="w-full h-full object-cover" />
            ) : getInitials(match.full_name || match.username)}
          </div>
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#16161e]",
            match.login_streak > 0 ? "bg-emerald-400" : "bg-slate-300"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text)] truncate">{match.full_name || match.username}</p>
          <p className="text-xs text-[var(--text-muted)]">@{match.username}</p>
          {match.location && (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
              <MapPin size={10} /> {match.location}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-yellow-500 justify-end">
            <Star size={12} className="fill-yellow-400" />
            <span className="text-xs font-semibold text-[var(--text)]">{match.rating?.toFixed(1)}</span>
          </div>
          <div className="text-xs text-[var(--text-muted)]">{match.rating_count} reviews</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-[#2a2a3a] rounded-full mb-4">
        <div className={cn('h-full rounded-full transition-all', scoreBg)} style={{ width: `${score}%` }} />
      </div>

      {/* Skill overlap */}
      {match.skill_overlap?.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {match.skill_overlap.slice(0, 3).map((s: any) => (
            <div key={s.skill} className="flex items-center gap-2 text-xs">
              <span className={cn(
                'px-2 py-0.5 rounded-full font-medium',
                s.direction === 'you_teach'
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'
              )}>
                {s.direction === 'you_teach' ? 'You teach' : 'They teach'}
              </span>
              <span className="text-[var(--text-muted)] truncate">{s.skill}</span>
            </div>
          ))}
        </div>
      )}

      {/* Teaching skills preview */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {match.skills_can_teach?.slice(0, 3).map((s: any) => (
          <span key={s.id} className="text-xs px-2 py-0.5 rounded-full" style={{ background: s.color + '20', color: s.color }}>
            {s.name}
          </span>
        ))}
        {match.skills_can_teach?.length > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#2a2a3a] text-[var(--text-muted)]">
            +{match.skills_can_teach.length - 3}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/profile/${match.id}`} className="btn-secondary text-xs py-2 flex-1 text-center">
          View Profile
        </Link>
        <Link href={`/chat?user=${match.id}`} className="btn-primary text-xs py-2 flex-1 text-center flex items-center justify-center gap-1.5">
          <MessageSquare size={13} /> Message
        </Link>
      </div>
    </motion.div>
  )
}

export default function MatchingPage() {
  const [search, setSearch] = useState('')
  const [minScore, setMinScore] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.get('/matching/').then(r => r.data),
  })

  const matches = data?.matches?.filter((m: any) => {
    const s = search.toLowerCase()
    const nameMatch = !s || m.username?.toLowerCase().includes(s) || m.full_name?.toLowerCase().includes(s) ||
      m.skills_can_teach?.some((sk: any) => sk.name.toLowerCase().includes(s))
    return nameMatch && m.match_score >= minScore
  }) || []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title mb-1">Find Your Match</h1>
        <p className="text-[var(--text-muted)]">Discover people to exchange skills with</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="input pl-10"
            placeholder="Search by name or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('btn-secondary flex items-center gap-2 text-sm', showFilters && 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400')}
        >
          <Filter size={15} /> Filters
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="label text-xs">Min Match Score: {minScore}%</label>
              <input type="range" min={0} max={80} step={10} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-40 accent-brand-500" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-1.5">
          <Users size={15} />
          <span>{matches.length} matches found</span>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="shimmer h-4 rounded w-20" />
              <div className="flex gap-3">
                <div className="shimmer w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 rounded w-24" />
                  <div className="shimmer h-3 rounded w-16" />
                </div>
              </div>
              <div className="shimmer h-2 rounded" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20">
          <Users size={48} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">No matches found</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
            Add more skills to your profile to get better matches, or lower the minimum score filter.
          </p>
          <Link href="/profile" className="btn-primary text-sm mt-4 inline-block">
            Update Profile
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {matches.map((m: any) => <MatchCard key={m.id} match={m} />)}
        </div>
      )}
    </div>
  )
}

