'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, Users, MessageSquare, Calendar, Star,
  MessageCircle, Trophy, Shield, LogOut, Menu, X, Bell,
  Sun, Moon, Coins, Flame, ChevronDown, BookOpen, Search, Clock
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { getInitials, cn } from '@/lib/utils'
import Image from 'next/image'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matching', label: 'Find Matches', icon: Users },
  { href: '/sessions', label: 'Sessions', icon: Calendar },
  { href: '/chat', label: 'Messages', icon: MessageSquare },
  { href: '/forum', label: 'Forum', icon: MessageCircle },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/verify-skill', label: 'Verify Skill', icon: BookOpen },
  { href: '/availability', label: 'My Availability', icon: Clock },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout, fetchMe } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      const token = localStorage.getItem('access_token')
      if (!token) router.push('/auth/login')
      else fetchMe()
    }
  }, [isAuthenticated])

  const { data: notifs, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications/').then(r => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  })

  const unreadCount = notifs?.unread_count || 0

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const markAllRead = async () => {
    await api.put('/notifications/read-all')
    refetchNotifs()
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col",
        "bg-[var(--bg-card)] border-r border-[var(--border)]",
        "transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-xl font-bold gradient-text">
            SkillShare
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* User summary */}
        <div className="p-4 border-b border-[var(--border)]">
          <Link href="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a3a] transition-colors">
            <div className="relative">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt="avatar" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                  {getInitials(user.full_name || user.username)}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[var(--bg-card)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-[var(--text)] truncate">{user.full_name || user.username}</p>
              <p className="text-xs text-[var(--text-muted)]">@{user.username}</p>
            </div>
          </Link>
          
          {/* Quick stats */}
          <div className="flex gap-3 mt-3 px-2">
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Coins size={12} className="text-yellow-500" />
              <span className="font-medium text-[var(--text)]">{(user.tokens ?? 0)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Flame size={12} className="text-orange-500" />
              <span className="font-medium text-[var(--text)]">{(user.login_streak ?? 0)}d</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-[var(--text)]">{(user.rating ?? 0).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn('nav-link', isActive && 'active')}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          
          {user.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setSidebarOpen(false)}
              className={cn('nav-link', pathname.startsWith('/admin') && 'active')}
            >
              <Shield size={18} />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-[var(--border)] space-y-0.5">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="nav-link w-full"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} className="nav-link w-full text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2">
              <Menu size={18} />
            </button>
            {/* Page title shown here on mobile */}
            <span className="font-display font-semibold text-[var(--text)] lg:hidden">
              {NAV_ITEMS.find(n => pathname === n.href || pathname.startsWith(n.href + '/'))?.label || 'SkillShare'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) refetchNotifs() }}
                className="relative btn-ghost p-2"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                      <span className="font-semibold text-sm text-[var(--text)]">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-brand-500 hover:text-brand-400">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs?.notifications?.length === 0 && (
                        <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                          No notifications yet
                        </div>
                      )}
                      {notifs?.notifications?.map((n: any) => (
                        <div
                          key={n.id}
                          className={cn(
                            "px-4 py-3 border-b border-[var(--border)] hover:bg-slate-50 dark:hover:bg-[#2a2a3a] cursor-pointer",
                            !n.is_read && "bg-brand-50 dark:bg-brand-500/5"
                          )}
                          onClick={async () => {
                            await api.put(`/notifications/${n.id}/read`)
                            refetchNotifs()
                            if (n.link) router.push(n.link)
                            setNotifOpen(false)
                          }}
                        >
                          <p className="text-sm font-medium text-[var(--text)]">{n.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Profile link */}
            <Link href="/profile" className="flex items-center gap-2 btn-ghost py-1.5 px-2">
              {user.avatar_url ? (
                <Image src={user.avatar_url} alt="avatar" width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(user.full_name || user.username)}
                </div>
              )}
              <span className="hidden sm:block text-sm font-medium text-[var(--text)]">{user.username}</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close notifications */}
      {notifOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
      )}
    </div>
  )
}