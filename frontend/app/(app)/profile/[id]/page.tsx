'use client'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { MapPin, Star, Coins, BookOpen, MessageSquare, Calendar, Users } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getInitials, timeAgo, cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useState } from 'react'

function SessionRequestModal({ teacherId, onClose }: { teacherId: number, onClose: () => void }) {
  const [form, setForm] = useState({ skill_id: 0, title: '', description: '', scheduled_at: '' })
  const { user } = useAuthStore()

  const { data: skills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => api.get('/skills/').then(r => r.data),
  })

  const requestMutation = useMutation({
    mutationFn: () => api.post('/sessions/', {
      ...form,
      student_id: user?.id,
    }),
    onSuccess: () => { toast.success('Session request sent!'); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-md">
        <h3 className="font-display font-bold text-lg text-[var(--text)] mb-4">Request a Session</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Skill to Learn</label>
            <select className="input text-sm" value={form.skill_id} onChange={e => setForm(f => ({ ...f, skill_id: Number(e.target.value) }))}>
              <option value={0}>Select a skill</option>
              {skills?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Session Title</label>
            <input className="input text-sm" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Introduction to Python" />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input text-sm resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Preferred Date & Time</label>
            <input type="datetime-local" className="input text-sm" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => requestMutation.mutate()} disabled={!form.skill_id || !form.title}
              className="btn-primary flex-1 text-sm py-2.5">
              Send Request
            </button>
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function PublicProfilePage() {
  const { id } = useParams()
  const { user: me } = useAuthStore()
  const [showSession, setShowSession] = useState(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => api.get(`/users/${id}`).then(r => r.data),
  })

  if (isLoading) return <div className="p-6 max-w-3xl mx-auto"><div className="card p-8 shimmer h-64" /></div>
  if (!profile) return <div className="p-6 text-center text-[var(--text-muted)]">User not found</div>

  const isMe = me?.id === profile.id

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden flex-shrink-0">
            {profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={80} height={80} className="w-full h-full object-cover" /> : getInitials(profile.full_name || profile.username)}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-[var(--text)]">{profile.full_name || profile.username}</h1>
            <p className="text-[var(--text-muted)] text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{profile.bio}</p>}
            {profile.location && <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-2"><MapPin size={14} /> {profile.location}</div>}
          </div>
          {!isMe && (
            <div className="flex flex-col gap-2">
              <Link href={`/chat?user=${profile.id}`} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2">
                <MessageSquare size={15} /> Message
              </Link>
              {profile.skills_can_teach?.length > 0 && (
                <button onClick={() => setShowSession(true)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                  <Calendar size={15} /> Request Session
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-yellow-500 mb-0.5">
              <Star size={14} className="fill-yellow-400" />
              <span className="font-bold text-[var(--text)]">{profile.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">rating</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--text)]">{profile.sessions_taught}</p>
            <p className="text-xs text-[var(--text-muted)]">taught</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--text)]">{profile.tokens}</p>
            <p className="text-xs text-[var(--text-muted)]">tokens</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-[var(--text)]">{profile.badges?.length || 0}</p>
            <p className="text-xs text-[var(--text-muted)]">badges</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text)] mb-3">Skills They Teach</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills_can_teach?.map((s: any) => (
              <span key={s.id} className="skill-chip" style={{ background: s.color + '20', color: s.color }}>{s.name}</span>
            ))}
            {!profile.skills_can_teach?.length && <p className="text-sm text-[var(--text-muted)]">No teaching skills listed</p>}
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text)] mb-3">Skills They Want to Learn</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills_want_to_learn?.map((s: any) => (
              <span key={s.id} className="skill-chip">{s.name}</span>
            ))}
            {!profile.skills_want_to_learn?.length && <p className="text-sm text-[var(--text-muted)]">No learning goals listed</p>}
          </div>
        </div>
      </div>

      {profile.badges?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text)] mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {profile.badges?.map((b: any) => (
              <div key={b.name} title={b.name} className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: b.color + '15', border: `2px solid ${b.color}40` }}>
                {b.icon}
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.recent_ratings?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-[var(--text)] mb-4">Reviews</h2>
          <div className="space-y-4">
            {profile.recent_ratings.map((r: any, i: number) => (
              <div key={i} className="flex gap-3 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold">
                  {r.rater_username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-[var(--text)]">{r.rater_username}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, j) => <Star key={j} size={11} className={j < r.score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'} />)}
                    </div>
                  </div>
                  {r.review && <p className="text-sm text-[var(--text-muted)]">{r.review}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSession && <SessionRequestModal teacherId={profile.id} onClose={() => setShowSession(false)} />}
    </div>
  )
}
