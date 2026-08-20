import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, compact = false): string {
  if (compact && value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (compact && value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`
}

export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function tweenNumber(
  el: HTMLElement,
  from: number,
  to: number,
  duration = 900,
  format: (v: number) => string = (v) => v.toFixed(0)
) {
  const start = performance.now()
  const diff = to - from

  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
  }

  function tick(now: number) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    const value = from + diff * easeOutCubic(progress)
    el.textContent = format(value)
    if (progress < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}
