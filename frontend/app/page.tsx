'use client'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Star, Users, BookOpen, Zap, Shield, Globe, ChevronRight } from 'lucide-react'

const FEATURED_SKILLS = [
  { name: 'Python', icon: '🐍', color: '#3b82f6', count: '2.4k' },
  { name: 'Guitar', icon: '🎸', color: '#f59e0b', count: '1.8k' },
  { name: 'Spanish', icon: '🇪🇸', color: '#ef4444', count: '3.1k' },
  { name: 'React', icon: '⚛️', color: '#06b6d4', count: '2.9k' },
  { name: 'UI Design', icon: '🎨', color: '#ec4899', count: '1.5k' },
  { name: 'Piano', icon: '🎹', color: '#8b5cf6', count: '1.2k' },
  { name: 'Photography', icon: '📷', color: '#6366f1', count: '2.0k' },
  { name: 'Cooking', icon: '👨‍🍳', color: '#fb923c', count: '1.7k' },
]

const STATS = [
  { label: 'Active Learners', value: '50K+', icon: Users },
  { label: 'Skills Available', value: '500+', icon: BookOpen },
  { label: 'Sessions Completed', value: '120K+', icon: Star },
  { label: 'Countries', value: '80+', icon: Globe },
]

const FEATURES = [
  {
    icon: '🎯',
    title: 'Smart Matching',
    desc: 'Our algorithm finds your perfect skill partner based on compatibility, location, and ratings.',
  },
  {
    icon: '💬',
    title: 'Built-in Chat',
    desc: 'Communicate directly with matched users through our real-time messaging system.',
  },
  {
    icon: '🏆',
    title: 'Earn & Grow',
    desc: 'Earn SkillTokens for every session, unlock badges, and climb the leaderboard.',
  },
  {
    icon: '✅',
    title: 'Verified Skills',
    desc: 'Take our skill verification quizzes to get a verified badge and attract more learners.',
  },
  {
    icon: '📅',
    title: 'Easy Scheduling',
    desc: 'Schedule sessions with a built-in calendar that respects your timezone.',
  },
  {
    icon: '🌍',
    title: 'Forum & Community',
    desc: 'Join category-based discussions, share tips, and grow together as a community.',
  },
]

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Learned Python', text: 'Found an amazing teacher in 2 days. We exchanged Python for Spanish lessons — completely free!', avatar: '👩‍💻', rating: 5 },
  { name: 'Marcus L.', role: 'Taught Guitar', text: 'Taught guitar to 12 people last month and earned enough tokens to get piano lessons. Incredible platform!', avatar: '🎸', rating: 5 },
  { name: 'Aiko T.', role: 'Learned Design', text: 'The skill matching is spot-on. My design teacher was perfectly matched to my level and goals.', avatar: '🎨', rating: 5 },
]

export default function HomePage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard')
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-bold">
            <span className="gradient-text">SkillShare</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#skills" className="hover:text-white transition-colors">Skills</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
              Get Started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        {/* BG glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium px-4 py-2 rounded-full mb-6">
              <Zap size={12} />
              100% Free — No hidden fees, no subscriptions
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Learn any skill.{' '}
              <span className="gradient-text">Teach</span> what you know.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              SkillShare connects people who want to learn with people who love to teach — 
              creating genuine peer-to-peer exchanges that are always free.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2 group">
                Start Learning Free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#how-it-works" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                How it works <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-display font-bold text-white mb-1">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Skills */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">500+ Skills Available</h2>
            <p className="text-slate-400">From coding to cooking, find the perfect skill exchange partner</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURED_SKILLS.map((skill, i) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className="card p-4 text-center cursor-pointer"
                style={{ borderColor: skill.color + '30' }}
              >
                <div className="text-3xl mb-2">{skill.icon}</div>
                <div className="font-medium text-white text-sm">{skill.name}</div>
                <div className="text-xs text-slate-500 mt-1">{skill.count} teachers</div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/register" className="btn-secondary inline-flex items-center gap-2 text-sm">
              Browse all skills <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">How SkillShare Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '👤', title: 'Create your profile', desc: 'Add skills you can teach and skills you want to learn. Take our quick verification quiz.' },
              { step: '02', icon: '🤝', title: 'Get matched', desc: 'Our algorithm finds users whose teach/learn skills complement yours perfectly.' },
              { step: '03', icon: '🚀', title: 'Start exchanging', desc: 'Chat, schedule sessions, meet virtually, and grow your skills — completely free.' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-display font-bold text-white/5 mb-4">{item.step}</div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-display font-semibold text-white text-xl mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-slate-400">A complete platform for peer-to-peer skill exchange</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:border-brand-500/30 transition-colors"
              >
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Loved by learners & teachers</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="card p-6"
              >
                <div className="flex mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{t.avatar}</div>
                  <div>
                    <div className="font-medium text-white text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-5xl font-bold text-white mb-6">
              Ready to start your skill journey?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join 50,000+ learners and teachers exchanging skills every day — for free.
            </p>
            <Link href="/auth/register" className="btn-primary text-lg py-4 px-10 inline-flex items-center gap-3 group">
              Create Free Account
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-bold gradient-text">SkillShare</div>
          <p className="text-slate-500 text-sm">© 2025 SkillShare. Free skill exchange for everyone.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
