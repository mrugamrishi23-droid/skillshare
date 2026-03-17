'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, XCircle, Star, Video, User, Send } from 'lucide-react'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400',
  accepted:  'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

function RateModal({ session, onClose }: { session: any, onClose: () => void }) {
  const [score, setScore] = useState(5)
  const [review, setReview] = useState('')
  const qc = useQueryClient()
  const mut = useMutation({
    mutationFn: () => api.post('/ratings/', { session_id: session.id, score, review }),
    onSuccess: () => { toast.success('Rating submitted!'); qc.invalidateQueries({ queryKey: ['sessions'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-md">
        <h3 className="font-display font-bold text-lg text-[var(--text)] mb-4">Rate this session</h3>
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setScore(n)} className={cn("w-10 h-10 rounded-xl text-xl transition-all", n <= score ? "scale-110" : "opacity-30")}>⭐</button>
          ))}
        </div>
        <textarea className="input resize-none text-sm mb-4" rows={3} value={review} onChange={e => setReview(e.target.value)} placeholder="Write a review (optional)..." />
        <div className="flex gap-3">
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="btn-primary flex-1 text-sm py-2.5">Submit</button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
        </div>
      </motion.div>
    </div>
  )
}

function SendSessionModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [form, setForm] = useState({ student_id: 0, skill_id: 0, title: '', description: '', scheduled_at: '', duration_minutes: 60, meet_link: '' })

  const { data: skills } = useQuery({ queryKey: ['all-skills'], queryFn: () => api.get('/skills/').then(r => r.data) })
  const { data: matches } = useQuery({ queryKey: ['matches'], queryFn: () => api.get('/matching/').then(r => r.data) })

  const mut = useMutation({
    mutationFn: () => api.post('/sessions/', form),
    onSuccess: () => { toast.success('Session request sent to learner! 📅'); qc.invalidateQueries({ queryKey: ['sessions'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to send'),
  })

  const canSend = form.student_id > 0 && form.skill_id > 0 && form.title && form.scheduled_at

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="font-display font-bold text-lg text-[var(--text)] mb-1">Send Session Request</h3>
        <p className="text-sm text-[var(--text-muted)] mb-5">As the teacher, you set the time and send it to the learner to accept.</p>

        <div className="space-y-4">
          <div>
            <label className="label">Select Learner</label>
            <select className="input text-sm" value={form.student_id} onChange={e => setForm(f => ({...f, student_id: Number(e.target.value)}))}>
              <option value={0}>Choose who you want to teach...</option>
              {matches?.matches?.map((m: any) => (
                <option key={m.id} value={m.id}>{m.full_name || m.username} (@{m.username})</option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-muted)] mt-1">Only showing your matched users</p>
          </div>

          <div>
            <label className="label">Skill You Will Teach</label>
            <select className="input text-sm" value={form.skill_id} onChange={e => setForm(f => ({...f, skill_id: Number(e.target.value)}))}>
              <option value={0}>Select skill...</option>
              {(user?.skills_can_teach ?? []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Session Title</label>
            <input className="input text-sm" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Introduction to Python — Lesson 1" />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input text-sm resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What will you cover in this session?" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date & Time</label>
              <input type="datetime-local" className="input text-sm" value={form.scheduled_at} onChange={e => setForm(f => ({...f, scheduled_at: e.target.value}))} />
            </div>
            <div>
              <label className="label">Duration</label>
              <select className="input text-sm" value={form.duration_minutes} onChange={e => setForm(f => ({...f, duration_minutes: Number(e.target.value)}))}>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Meet Link (optional)</label>
            <input className="input text-sm" value={form.meet_link} onChange={e => setForm(f => ({...f, meet_link: e.target.value}))} placeholder="https://meet.google.com/xxx or Zoom link" />
            <p className="text-xs text-[var(--text-muted)] mt-1">You can also add this after the learner accepts</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => mut.mutate()} disabled={!canSend || mut.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
            {mut.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={15}/> Send to Learner</>}
          </button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
        </div>
      </motion.div>
    </div>
  )
}

export default function SessionsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [filter, setFilter] = useState<'all'|'pending'|'accepted'|'completed'>('all')
  const [ratingSession, setRatingSession] = useState<any>(null)
  const [showSend, setShowSend] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions/').then(r => r.data),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...body }: any) => api.put(`/sessions/${id}`, body),
    onSuccess: () => { toast.success('Session updated!'); qc.invalidateQueries({ queryKey: ['sessions'] }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })

  const sessions = (data?.sessions ?? []).filter((s: any) => {
    if (filter === 'all') return true
    return s.status === filter
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title mb-1">Sessions</h1>
          <p className="text-[var(--text-muted)] text-sm">Teachers send session requests · Learners accept or decline</p>
        </div>
        <button onClick={() => setShowSend(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Send size={15}/> Send Session Request
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-6 border-brand-500/20 bg-brand-50 dark:bg-brand-500/5">
        <div className="flex items-start gap-3 text-sm">
          <span className="text-2xl">💡</span>
          <div>
            <p className="font-medium text-[var(--text)]">How sessions work</p>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              <strong>Teachers</strong> pick a learner, set the date/time, and send the request. 
              <strong> Learners</strong> simply accept or decline. No back-and-forth needed!
            </p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {(['all','pending','accepted','completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all whitespace-nowrap",
              filter === f ? "bg-brand-500 text-white shadow-sm" : "bg-slate-100 dark:bg-[#2a2a3a] text-[var(--text-muted)] hover:text-[var(--text)]")}>
            {f} {f === 'all' ? `(${data?.sessions?.length ?? 0})` : `(${(data?.sessions ?? []).filter((s:any) => s.status === f).length})`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i) => <div key={i} className="card p-5 shimmer h-28" />)}</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="mx-auto text-[var(--text-muted)] opacity-20 mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
            {filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
          </h3>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {filter === 'all' ? 'As a teacher, send a session request to one of your matches.' : `You have no ${filter} sessions right now.`}
          </p>
          {filter === 'all' && (
            <button onClick={() => setShowSend(true)} className="btn-primary text-sm inline-flex items-center gap-2">
              <Send size={14}/> Send First Session Request
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s: any) => {
            const isTeacher = s.teacher.id === user?.id
            const other = isTeacher ? s.student : s.teacher
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: s.skill?.color || '#6366f1' }}>
                      {s.skill?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-[var(--text)]">{s.title}</h3>
                        <span className={cn("badge text-xs", STATUS_COLORS[s.status])}>{s.status}</span>
                        <span className={cn("badge text-xs", isTeacher
                          ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          : "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400")}>
                          {isTeacher ? '👨‍🏫 You are teaching' : '🎓 You are learning'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <User size={12} />
                          {isTeacher ? `Student: ${other.username}` : `Teacher: ${other.username}`}
                        </div>
                        {s.scheduled_at && (
                          <div className="flex items-center gap-1.5 font-medium text-[var(--text)]">
                            <Clock size={12} className="text-brand-500" />
                            {formatDateTime(s.scheduled_at)}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          ⏱ {s.duration_minutes} min
                        </div>
                        <div className="flex items-center gap-1.5">
                          🪙 {s.tokens_exchanged} tokens
                        </div>
                      </div>

                      {s.description && (
                        <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-lg">{s.description}</p>
                      )}

                      {/* Status message for learner */}
                      {!isTeacher && s.status === 'pending' && (
                        <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                          ⏳ {other.username} has invited you to a session — accept or decline below
                        </div>
                      )}
                      {isTeacher && s.status === 'pending' && (
                        <div className="mt-2 text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
                          📨 Waiting for {other.username} to accept
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* LEARNER actions — can only accept/decline */}
                    {!isTeacher && s.status === 'pending' && (
                      <>
                        <button onClick={() => updateMut.mutate({ id: s.id, status: 'accepted' })}
                          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                          <CheckCircle size={14}/> Accept
                        </button>
                        <button onClick={() => updateMut.mutate({ id: s.id, status: 'cancelled' })}
                          className="btn-danger text-xs py-2 px-3 flex items-center gap-1.5">
                          <XCircle size={14}/> Decline
                        </button>
                      </>
                    )}

                    {/* TEACHER actions — can add meet link or mark complete */}
                    {isTeacher && s.status === 'pending' && (
                      <button onClick={() => updateMut.mutate({ id: s.id, status: 'cancelled' })}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-red-400">
                        <XCircle size={14}/> Cancel
                      </button>
                    )}

                    {s.status === 'accepted' && (
                      <>
                        {s.meet_link ? (
                          <a href={s.meet_link} target="_blank" rel="noreferrer"
                            className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                            <Video size={14}/> Join Session
                          </a>
                        ) : isTeacher && (
                          <button onClick={() => {
                            const link = prompt('Enter meet link (Google Meet, Zoom, etc.):')
                            if (link) updateMut.mutate({ id: s.id, meet_link: link })
                          }} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                            <Video size={14}/> Add Meet Link
                          </button>
                        )}
                        <button onClick={() => updateMut.mutate({ id: s.id, status: 'completed' })}
                          className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                          <CheckCircle size={14}/> Mark Complete
                        </button>
                      </>
                    )}

                    {s.status === 'completed' && !s.has_rating && (
                      <button onClick={() => setRatingSession(s)}
                        className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5">
                        <Star size={14}/> Rate Session
                      </button>
                    )}
                    {s.status === 'completed' && s.has_rating && (
                      <span className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle size={12}/> Rated
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {ratingSession && <RateModal session={ratingSession} onClose={() => setRatingSession(null)} />}
      {showSend && <SendSessionModal onClose={() => setShowSend(false)} />}
    </div>
  )
}
