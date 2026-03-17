import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

export interface User {
  id: number
  email: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  timezone: string
  role: string
  is_verified: boolean
  rating: number
  rating_count: number
  tokens: number
  login_streak: number
  sessions_taught: number
  sessions_learned: number
  skills_can_teach: Skill[]
  skills_want_to_learn: Skill[]
  badges: Badge[]
  created_at: string
}

export interface Skill {
  id: number
  name: string
  category: string
  color: string
  icon?: string
}

export interface Badge {
  name: string
  icon: string
  color: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          set({ user: data.user, isAuthenticated: true })
          await get().fetchMe()
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email, username, password, fullName) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', {
            email, username, password, full_name: fullName
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          set({ user: data.user, isAuthenticated: true })
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data, isAuthenticated: true })
        } catch {
          set({ user: null, isAuthenticated: false })
        }
      },

      updateUser: (data) => {
        const current = get().user
        if (current) set({ user: { ...current, ...data } })
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
