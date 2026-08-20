'use client'

import { cn } from '@/lib/utils'
import { ReactNode, useRef, useEffect, useState } from 'react'

interface StatTileProps {
  label: string
  value: string | number
  valuePrefix?: string
  delta?: number // percentage change
  accent?: boolean // purple accent number
  live?: boolean // show live indicator
  lastUpdated?: Date
  children?: ReactNode
  className?: string
}

export default function StatTile({
  label,
  value,
  valuePrefix = '',
  delta,
  accent,
  live,
  lastUpdated,
  children,
  className,
}: StatTileProps) {
  const [secondsAgo, setSecondsAgo] = useState(0)

  useEffect(() => {
    if (!live || !lastUpdated) return
    const tick = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [live, lastUpdated])

  return (
    <div
      className={cn(
        'relative bg-panel border border-border-default rounded-stat p-5',
        'transition-all duration-200',
        'hover:border-purple-soft',
        className
      )}
    >
      {/* Live indicator */}
      {live && (
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
          <div className="relative flex items-center justify-center w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-green animate-pulse-ring opacity-70" />
            <span className="relative w-2 h-2 rounded-full bg-green" />
          </div>
          <span className="text-[11px] text-text-faint">
            Updated {secondsAgo}s ago
          </span>
        </div>
      )}

      {/* Label */}
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
        {label}
      </p>

      {/* Value */}
      <p className={cn(
        'text-[30px] font-semibold leading-none mb-1',
        accent ? 'text-purple' : 'text-text'
      )}>
        {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Delta */}
      {delta !== undefined && (
        <p className={cn(
          'text-[12.5px] font-medium',
          delta >= 0 ? 'text-green' : 'text-red'
        )}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs last period
        </p>
      )}

      {children}
    </div>
  )
}
