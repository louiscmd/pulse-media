import { cn } from '@/lib/utils'
import type { ContentStatus, EditStatus } from '@/types/database'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#9a97a6', bg: 'rgba(154,151,166,0.12)' },
  awaiting_review: { label: 'Awaiting Review', color: '#9b5cff', bg: 'rgba(155,92,255,0.13)' },
  approved: { label: 'Approved', color: '#5ce6a8', bg: 'rgba(92,230,168,0.12)' },
  footage_needed: { label: 'Footage Needed', color: '#ffc36b', bg: 'rgba(255,195,107,0.12)' },
  footage_received: { label: 'Footage Received', color: '#5ce6a8', bg: 'rgba(92,230,168,0.10)' },
  in_editing: { label: 'In Editing', color: '#9b5cff', bg: 'rgba(155,92,255,0.13)' },
  ready_to_post: { label: 'Ready to Post', color: '#5ce6a8', bg: 'rgba(92,230,168,0.14)' },
  posted: { label: 'Posted', color: '#615e6d', bg: 'rgba(97,94,109,0.12)' },
  // Edit statuses
  in_review: { label: 'In Review', color: '#9b5cff', bg: 'rgba(155,92,255,0.13)' },
  changes_requested: { label: 'Changes Requested', color: '#ffc36b', bg: 'rgba(255,195,107,0.12)' },
}

interface StatusBadgeProps {
  status: ContentStatus | EditStatus | string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    color: '#9a97a6',
    bg: 'rgba(154,151,166,0.12)',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-pill text-[11px] font-bold tracking-wide',
        className
      )}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  )
}
