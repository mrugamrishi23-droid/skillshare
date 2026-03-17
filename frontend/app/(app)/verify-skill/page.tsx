'use client'
import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, Trophy, ArrowRight, X } from 'lucide-react'
import api from '@/lib/api'
import { cn, getProficiencyColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

function QuizModal({ skill, onClose }: { skill: any, onClose: (result?: any) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', skill.id],
    queryFn: () => api.get(`/skills/${skill.id}/quiz`).then(r => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/skills/${skill.id}/quiz/submit`, {
      skill_id: skill.id,
      answers: quiz.questions.map((_: any, i: number) => answers[i] ?? -1)
    }),
    onSuccess: (res: any) => {
      setResult(res.data)
      setSubmitted(true)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })

  const allAnswered = quiz?.questions && Object.keys(answers).length === quiz.questions.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[var(--text)]">{skill.name} Verification</h3>
            <p className="text-xs text-[var(--text-muted)]">Answer all questions to get your proficiency level</p>
          </div>
          <button onClick={() => onClose()} className="btn-ghost p-1.5"><X size={18} /></button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
          </div>
        ) : submitted && result ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="text-6xl mb-4">{result.score >= 70 ? '🎉' : '📚'}</div>
            <h3 className="font-display text-2xl font-bold text-[var(--text)] mb-2">
              Score: {result.score.toFixed(0)}%
            </h3>
            <p className="text-[var(--text-muted)] mb-4">{result.correct} / {result.total} correct</p>
            <div className={cn("badge text-sm px-4 py-1.5 mx-auto mb-4", getProficiencyColor(result.proficiency))}>
              {result.proficiency} level
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-6">{result.message}</p>
            <button onClick={() => onClose(result)} className="btn-primary">
              {result.verified ? '✅ Skill Verified!' : 'Close'}
            </button>
          </motion.div>
        ) : (
          <>
            <div className="space-y-6 mb-6">
              {quiz?.questions?.map((q: any, qi: number) => (
                <div key={q.id}>
                  <p className="font-medium text-sm text-[var(--text)] mb-3">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt: string, oi: number) => (
                      <button key={oi} onClick={() => setAnswers(a => ({ ...a, [qi]: oi }))}
                        className={cn(
                          "w-full text-left p-3 rounded-xl text-sm border transition-all",
                          answers[qi] === oi
                            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300"
                            : "border-[var(--border)] hover:border-brand-500/30 text-[var(--text)]"
                        )}>
                        <span className="font-medium text-[var(--text-muted)] mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!allAnswered || submitMutation.isPending}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
            >
              {submitMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Submit Answers <ArrowRight size={16} /></>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function VerifySkillPage() {
  const { fetchMe } = useAuthStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [quizSkill, setQuizSkill] = useState<any>(null)

  const { data: skills } = useQuery({
    queryKey: ['skills-with-quiz'],
    queryFn: () => api.get('/skills/').then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['skill-categories'],
    queryFn: () => api.get('/skills/categories').then(r => r.data),
  })

  const filtered = skills?.filter((s: any) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || s.category === selectedCategory
    return matchSearch && matchCat && s.has_quiz
  }) || []

  const handleQuizClose = (result?: any) => {
    setQuizSkill(null)
    if (result?.verified) {
      fetchMe()
      toast.success(`🎉 ${quizSkill?.name} verified! Level: ${result.proficiency}`)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="page-title mb-2">Verify Your Skills</h1>
        <p className="text-[var(--text-muted)]">
          Take a short quiz to get a verified badge and proficiency level for your skills.
          Verified skills attract more learners and unlock the Verified Expert badge.
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { icon: '🎯', title: 'Take the Quiz', desc: '5-10 questions per skill' },
          { icon: '📊', title: 'Get Rated', desc: 'Beginner to Expert levels' },
          { icon: '✅', title: 'Get Verified', desc: 'Show off your badge' },
        ].map(item => (
          <div key={item.title} className="card p-4 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="font-semibold text-sm text-[var(--text)]">{item.title}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input className="input pl-10 text-sm" placeholder="Search skills..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-sm w-48" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories?.categories?.map((c: string) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Skills grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((skill: any) => (
          <motion.div key={skill.id} whileHover={{ y: -2 }} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: skill.color + '20' }}>
                {skill.icon || skill.name[0]}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{skill.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{skill.category}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2">
              {skill.description || `Test your knowledge of ${skill.name}`}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">{skill.quiz_count || '~8'} questions</span>
              <button
                onClick={() => setQuizSkill(skill)}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <CheckCircle size={13} /> Take Quiz
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Trophy size={40} className="mx-auto text-[var(--text-muted)] opacity-30 mb-4" />
          <p className="text-[var(--text-muted)]">No skills with quizzes found</p>
        </div>
      )}

      {quizSkill && <QuizModal skill={quizSkill} onClose={handleQuizClose} />}
    </div>
  )
}
