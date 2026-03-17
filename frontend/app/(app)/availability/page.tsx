'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Clock, Save, Info } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const TIMEZONES = [
  'UTC', 'Asia/Kolkata', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'America/Chicago', 'America/Toronto',
]

const TIME_OPTIONS = [
  '', '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  '09:00 PM', '10:00 PM',
]

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Record<string, string>>({})
  const [timezone, setTimezone] = useState('UTC')
  const [note, setNote] = useState('')
  const [loaded, setLoaded] = useState(false)

  const { isLoading } = useQuery({
    queryKey: ['my-availability'],
    queryFn: () => api.get('/availability/me').then(r => r.data),
    onSuccess: (data: any) => {
      if (!loaded) {
        setSlots(data.slots || {})
        setTimezone(data.timezone || 'UTC')
        setNote(data.note || '')
        setLoaded(true)
      }
    }
  })

  const saveMut = useMutation({
    mutationFn: () => api.put('/availability/me', { ...slots, timezone, note }),
    onSuccess: () => toast.success('Availability saved! Learners can now see your schedule ✅'),
    onError: () => toast.error('Failed to save'),
  })

  const toggle = (day: string) => {
    setSlots(s => {
      const updated = { ...s }
      if (updated[day]) delete updated[day]
      else updated[day] = '09:00 AM - 05:00 PM'
      return updated
    })
  }

  const setTime = (day: string, part: 'from' | 'to', value: string) => {
    setSlots(s => {
      const current = s[day] || '09:00 AM - 05:00 PM'
      const [from, to] = current.split(' - ')
      const updated = part === 'from' ? `${value} - ${to}` : `${from} - ${value}`
      return { ...s, [day]: updated }
    })
  }

  if (isLoading) return <div className="p-6"><div className="card p-8 shimmer h-64" /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title mb-1">My Availability</h1>
        <p className="text-[var(--text-muted)] text-sm">
          Set your weekly teaching schedule so learners know when you are free.
        </p>
      </div>

      {/* Info */}
      <div className="card p-4 border-brand-500/20 bg-brand-50 dark:bg-brand-500/5 flex gap-3">
        <Info size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text-muted)]">
          This schedule is shown on your public profile. When you send a session request,
          learners can see these times to know you are available.
        </p>
      </div>

      {/* Timezone */}
      <div className="card p-5">
        <label className="label">Your Timezone</label>
        <select className="input text-sm" value={timezone} onChange={e => setTimezone(e.target.value)}>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      {/* Days */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-[var(--text)]">Weekly Schedule</h2>
        {DAYS.map(day => {
          const active = !!slots[day.key]
          const [from, to] = (slots[day.key] || '09:00 AM - 05:00 PM').split(' - ')
          return (
            <motion.div key={day.key} layout className={`rounded-xl border p-4 transition-all ${active ? 'border-brand-500/30 bg-brand-50 dark:bg-brand-500/5' : 'border-[var(--border)]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggle(day.key)}
                    className={`w-10 h-6 rounded-full transition-all relative ${active ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${active ? 'left-5' : 'left-1'}`} />
                  </button>
                  <span className={`font-medium text-sm ${active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
                    {day.label}
                  </span>
                </div>
                {!active && <span className="text-xs text-[var(--text-muted)]">Not available</span>}
              </div>

              {active && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-brand-500" />
                    <span className="text-xs text-[var(--text-muted)]">From</span>
                    <select className="input text-xs py-1.5 w-32" value={from}
                      onChange={e => setTime(day.key, 'from', e.target.value)}>
                      {TIME_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">To</span>
                    <select className="input text-xs py-1.5 w-32" value={to}
                      onChange={e => setTime(day.key, 'to', e.target.value)}>
                      {TIME_OPTIONS.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <span className="text-xs text-emerald-500 font-medium">✓ Available</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Note */}
      <div className="card p-5">
        <label className="label">Additional Note <span className="text-[var(--text-muted)] font-normal">(optional)</span></label>
        <textarea className="input resize-none text-sm" rows={3} value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. I prefer morning sessions. Can do extra hours on weekends. Best to message me before requesting." />
      </div>

      <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm">
        {saveMut.isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16}/> Save Availability</>}
      </button>
    </div>
  )
}
