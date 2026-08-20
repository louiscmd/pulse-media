'use client'

import { cn } from '@/lib/utils'

interface ChipProps {
  label: string
  selected: boolean
  onClick: () => void
  className?: string
}

export default function Chip({ label, selected, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-pill text-[13px] font-medium border transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple',
        selected
          ? 'bg-purple/15 border-purple-soft text-purple'
          : 'bg-transparent border-border-default text-text-dim hover:border-purple-soft hover:text-text',
        className
      )}
    >
      {label}
    </button>
  )
}

interface ChipGroupProps {
  options: string[]
  selected: string[]
  onChange: (value: string[]) => void
  multi?: boolean
  className?: string
}

export function ChipGroup({ options, selected, onChange, multi = false, className }: ChipGroupProps) {
  function toggle(opt: string) {
    if (multi) {
      onChange(
        selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]
      )
    } else {
      onChange(selected.includes(opt) ? [] : [opt])
    }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => (
        <Chip
          key={opt}
          label={opt}
          selected={selected.includes(opt)}
          onClick={() => toggle(opt)}
        />
      ))}
    </div>
  )
}
