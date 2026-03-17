'use client'
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Edit3, MapPin, Star, Coins, Flame, BookOpen, Plus, X, Check, Save, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { getInitials, cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

function SkillInput({ type, existingIds, onAdd, onClose }: {
  type: 'teach' | 'learn'
  existingIds: Set<number>
  onAdd: (skillId: number) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: allSkills } = useQuery({
    queryKey: ['all-skills'],
    queryFn: () => api.get('/skills/').then(r => r.data),
  })

  useEffect(() => { inputRef.current?.focus() }, [])

  const suggestions: any[] = (allSkills || [])
    .filter((s: any) => !existingIds.has(s.id) && s.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8)

  const isExactMatch = suggestions.some(s => s.name.toLowerCase() === query.toLowerCase())

  const createAndAdd = async (name: string) => {
    try {
      const { data: newSkill } = await api.post('/skills/create-custom', { name })
      onAdd(newSkill.id)
      setQuery('')
    } catch {
      const existing = (allSkills || []).find((s: any) => s.name.toLowerCase() === name.toLowerCase())
      if (existing) { onAdd(existing.id); setQuery('') }
      else toast.error('Could not add skill. Try selecting from the list.')
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, suggestions.length)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions[highlighted]) { onAdd(suggestions[highlighted].id); setQuery(''); setHighlighted(0) }
      else if (query.trim() && !isExactMatch) await createAndAdd(query.trim())
    } else if (e.key === 'Escape') onClose()
  }

  return (
    <div className="mb-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(0) }}
          onKeyDown={handleKeyDown}
          placeholder={type === 'teach' ? 'e.g. Guitar, Python, Cooking...' : 'e.g. Spanish, Piano, Design...'}
          className="input pl-9 text-sm w-full"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <X size={14} />
          </button>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-1.5 ml-1">
        Type any skill name and press Enter to add it
      </p>
      <AnimatePresence>
        {query && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg overflow-hidden z-10 relative">
            {suggestions.map((s, i) => (
              <button key={s.id}
                onClick={() => { onAdd(s.id); setQuery(''); setHighlighted(0) }}
                onMouseEnter={() => setHighlighted(i)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors',
                  i === highlighted ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'hover:bg-slate-50 dark:hover:bg-[#2a2a3a] text-[var(--text)]')}>
                <span className="text-base">{s.icon || '🎯'}</span>
                <span className="flex-1">{s.name}</span>
                <span className="text-xs text-[var(--text-muted)]">{s.category}</span>
              </button>
            ))}
            {query.trim() && !isExactMatch && (
              <button onClick={() => createAndAdd(query.trim())}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left border-t border-[var(--border)] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-[var(--text-muted)] transition-colors">
                <Plus size={14} className="text-emerald-500 flex-shrink-0" />
                <span>Add "<strong className="text-[var(--text)]">{query}</strong>" as a new skill</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {!query && (
        <div className="mt-3">
          <p className="text-xs text-[var(--text-muted)] mb-2">Quick picks:</p>
          <div className="flex flex-wrap gap-1.5">
            {(allSkills || []).filter((s: any) => !existingIds.has(s.id)).slice(0, 10).map((s: any) => (
              <button key={s.id} onClick={() => onAdd(s.id)}
                className="skill-chip hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-xs">
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: '', bio: '', location: '', username: '' })
  const [addingSkill, setAddingSkill] = useState<'teach' | 'learn' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const { data: ratings } = useQuery({
    queryKey: ['my-ratings'],
    queryFn: () => api.get(`/ratings/user/${user?.id}`).then(r => r.data),
    enabled: !!user,
  })
  const { data: badges } = useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/gamification/badges').then(r => r.data),
  })
  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/users/me', data),
    onSuccess: () => { toast.success('Profile updated!'); fetchMe(); setEditing(false) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Update failed'),
  })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const fd = new FormData(); fd.append('file', file)
    try { await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success('Avatar updated!'); fetchMe() }
    catch { toast.error('Failed to upload avatar') }
  }

  const addSkill = async (skillId: number, type: 'teach' | 'learn') => {
    try { await api.post(`/users/me/skills/${type}/${skillId}`); fetchMe(); toast.success('Skill added! ✨') }
    catch (e: any) { toast.error(e?.response?.data?.detail || 'Failed') }
  }
  const removeSkill = async (skillId: number, type: 'teach' | 'learn') => {
    await api.delete(`/users/me/skills/${type}/${skillId}`); fetchMe()
  }

  if (!user) return null
  const teachIds = new Set((user.skills_can_teach ?? []).map((s: any) => s.id))
  const learnIds = new Set((user.skills_want_to_learn ?? []).map((s: any) => s.id))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-brand-500 flex items-center justify-center text-white font-bold text-2xl">
              {user.avatar_url ? <Image src={user.avatar_url} alt="avatar" width={96} height={96} className="w-full h-full object-cover" /> : getInitials(user.full_name || user.username)}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><label className="label text-xs">Full Name</label><input className="input text-sm" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} /></div>
                  <div><label className="label text-xs">Username</label><input className="input text-sm" value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} /></div>
                </div>
                <div><label className="label text-xs">Bio</label><textarea className="input text-sm resize-none" rows={2} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Tell others about yourself..." /></div>
                <div><label className="label text-xs">Location</label><input className="input text-sm" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="City, Country" /></div>
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate(form)} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save size={14} /> Save</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="font-display text-2xl font-bold text-[var(--text)]">{user.full_name || user.username}</h1>
                    <p className="text-[var(--text-muted)] text-sm">@{user.username}</p>
                  </div>
                  <button onClick={() => { setForm({full_name: user.full_name||'', bio: user.bio||'', location: user.location||'', username: user.username||''}); setEditing(true) }} className="btn-secondary text-sm flex items-center gap-2 py-2"><Edit3 size={14} /> Edit</button>
                </div>
                {user.bio && <p className="text-[var(--text-muted)] text-sm mt-2 leading-relaxed">{user.bio}</p>}
                {user.location && <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] mt-2"><MapPin size={14} /> {user.location}</div>}
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--border)]">
          <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1"><Star size={16} className="fill-yellow-400" /><span className="font-bold text-[var(--text)]">{(user.rating??0).toFixed(1)}</span></div><p className="text-xs text-[var(--text-muted)]">{user.rating_count??0} ratings</p></div>
          <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-yellow-500 mb-1"><Coins size={16} /><span className="font-bold text-[var(--text)]">{user.tokens??0}</span></div><p className="text-xs text-[var(--text-muted)]">tokens</p></div>
          <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-brand-500 mb-1"><BookOpen size={16} /><span className="font-bold text-[var(--text)]">{user.sessions_taught??0}</span></div><p className="text-xs text-[var(--text-muted)]">taught</p></div>
          <div className="text-center"><div className="flex items-center justify-center gap-1.5 text-orange-500 mb-1"><Flame size={16} /><span className="font-bold text-[var(--text)]">{user.login_streak??0}d</span></div><p className="text-xs text-[var(--text-muted)]">streak</p></div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <div><h2 className="font-semibold text-[var(--text)]">Skills I Can Teach</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">Type any skill — even custom ones</p></div>
            <button onClick={() => setAddingSkill(addingSkill === 'teach' ? null : 'teach')} className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all', addingSkill === 'teach' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400')}>
              {addingSkill === 'teach' ? <><X size={13}/>Close</> : <><Plus size={13}/>Add Skill</>}
            </button>
          </div>
          <AnimatePresence>
            {addingSkill === 'teach' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                <SkillInput type="teach" existingIds={teachIds} onAdd={id => addSkill(id, 'teach')} onClose={() => setAddingSkill(null)} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap gap-2 mt-3">
            {(user.skills_can_teach ?? []).map((s: any) => (
              <motion.div key={s.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 skill-chip group pr-1" style={{ background: (s.color||'#6366f1')+'20', color: s.color||'#6366f1' }}>
                <span>{s.name}</span>
                <button onClick={() => removeSkill(s.id, 'teach')} className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 transition-all"><X size={10} /></button>
              </motion.div>
            ))}
            {(user.skills_can_teach ?? []).length === 0 && <p className="text-sm text-[var(--text-muted)] py-2">No teaching skills yet. <button onClick={() => setAddingSkill('teach')} className="text-brand-500 hover:underline">Add your first!</button></p>}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border)]">
            <Link href="/verify-skill" className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1.5"><Check size={12} /> Verify a skill to get a badge</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
          <div className="flex items-center justify-between mb-1">
            <div><h2 className="font-semibold text-[var(--text)]">Skills I Want to Learn</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">Type any skill — even custom ones</p></div>
            <button onClick={() => setAddingSkill(addingSkill === 'learn' ? null : 'learn')} className={cn('flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all', addingSkill === 'learn' ? 'bg-red-50 dark:bg-red-500/10 text-red-500' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400')}>
              {addingSkill === 'learn' ? <><X size={13}/>Close</> : <><Plus size={13}/>Add Skill</>}
            </button>
          </div>
          <AnimatePresence>
            {addingSkill === 'learn' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                <SkillInput type="learn" existingIds={learnIds} onAdd={id => addSkill(id, 'learn')} onClose={() => setAddingSkill(null)} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap gap-2 mt-3">
            {(user.skills_want_to_learn ?? []).map((s: any) => (
              <motion.div key={s.id} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1.5 skill-chip group pr-1">
                <span>{s.name}</span>
                <button onClick={() => removeSkill(s.id, 'learn')} className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 transition-all"><X size={10} /></button>
              </motion.div>
            ))}
            {(user.skills_want_to_learn ?? []).length === 0 && <p className="text-sm text-[var(--text-muted)] py-2">No learning goals yet. <button onClick={() => setAddingSkill('learn')} className="text-purple-500 hover:underline">Add your first!</button></p>}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
        <h2 className="font-semibold text-[var(--text)] mb-4">Badges & Achievements</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {badges?.all?.map((b: any) => (
            <div key={b.id} title={`${b.name}: ${b.description}`} className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border transition-all', b.earned ? 'border-transparent' : 'border-dashed border-[var(--border)] opacity-30 grayscale')} style={b.earned ? { background: b.color+'15', borderColor: b.color+'40' } : {}}>
              <span className="text-2xl">{b.icon}</span>
              <span className="text-[9px] text-center leading-tight text-[var(--text-muted)] font-medium">{b.name}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {ratings?.ratings?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-6">
          <h2 className="font-semibold text-[var(--text)] mb-4">Recent Reviews</h2>
          <div className="space-y-4">
            {ratings.ratings.map((r: any) => (
              <div key={r.id} className="flex gap-3 pb-4 border-b border-[var(--border)] last:border-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                  {r.rater_avatar ? <Image src={r.rater_avatar} alt="" width={36} height={36} className="w-full h-full object-cover" /> : r.rater_username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-[var(--text)]">{r.rater_username}</span>
                    <div className="flex">{[...Array(5)].map((_,i) => <Star key={i} size={12} className={i < r.score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'} />)}</div>
                  </div>
                  {r.review && <p className="text-sm text-[var(--text-muted)]">{r.review}</p>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

