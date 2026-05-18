import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  if (!date) return ''

  const target = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.round((target.getTime() - now.getTime()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const ranges = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]

  for (const [unit, seconds] of ranges) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(diffInSeconds / seconds), unit)
    }
  }

  return ''
}

export function deriveQuarter(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `Q${quarter} ${date.getFullYear()}`
}
