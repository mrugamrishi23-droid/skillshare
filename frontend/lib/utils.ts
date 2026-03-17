import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  return format(new Date(date), fmt)
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a')
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-emerald-500'
  if (rating >= 3.5) return 'text-yellow-500'
  if (rating >= 2.5) return 'text-orange-500'
  return 'text-red-500'
}

export function getMatchColor(score: number): string {
  if (score >= 80) return 'text-emerald-500'
  if (score >= 60) return 'text-brand-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-gray-400'
}

export function getProficiencyColor(level: string): string {
  const map: Record<string, string> = {
    expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    advanced: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    beginner: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[level] || map.beginner
}

export const CATEGORY_COLORS: Record<string, string> = {
  Programming: '#3b82f6',
  Design: '#ec4899',
  Music: '#f59e0b',
  Language: '#22c55e',
  'Math & Science': '#8b5cf6',
  Business: '#14b8a6',
  Marketing: '#0ea5e9',
  Writing: '#f97316',
  Photography: '#6366f1',
  Fitness: '#84cc16',
  Cooking: '#fb923c',
  Art: '#a855f7',
  Finance: '#10b981',
  'Data Science': '#6366f1',
  Other: '#6b7280',
}
