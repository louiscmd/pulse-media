'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import type { ContentIdea } from '@/types/database'

const LIFECYCLE_STAGES = [
  'draft',
  'awaiting_review',
  'approved',
  'footage_needed',
  'footage_received',
  'in_editing',
  'ready_to_post',
  'posted',
] as const

const STAGE_INDEX: Record<string, number> = Object.fromEntries(
  LIFECYCLE_STAGES.map((s, i) => [s, i])
)

interface IdeaCardProps {
  idea: ContentIdea
  onApprove?: (id: string) => Promise<void>
  onRequestChanges?: (id: string) => Promise<void>
  compact?: boolean
}

export default function IdeaCard({ idea, onApprove, onRequestChanges, compact }: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<'approve' | 'changes' | null>(null)

  const stageIdx = STAGE_INDEX[idea.status] ?? 0
  const isActionable = idea.status === 'awaiting_review'

  async function handleApprove() {
    if (!onApprove) return
    setActionLoading('approve')
    await onApprove(idea.id)
    setActionLoading(null)
    setExpanded(false)
  }

  async function handleRequestChanges() {
    if (!onRequestChanges) return
    setActionLoading('changes')
    await onRequestChanges(idea.id)
    setActionLoading(null)
    setExpanded(false)
  }

  return (
    <>
      {/* Card */}
      <div
        className={cn(
          'bg-panel rounded-card border transition-all duration-200 overflow-hidden',
          'border-[1.4px] border-purple-soft',
          'shadow-[0_8px_30px_-18px_rgba(155,92,255,0.18)]',
          isActionable && 'cursor-pointer hover:shadow-[0_12px_40px_-14px_rgba(155,92,255,0.28)]',
          isActionable && 'hover:border-purple/50'
        )}
        onClick={() => isActionable && setExpanded((e) => !e)}
        role={isActionable ? 'button' : undefined}
        tabIndex={isActionable ? 0 : undefined}
        onKeyDown={(e) => isActionable && e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={isActionable ? expanded : undefined}
      >
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <StatusBadge status={idea.status} />
            {idea.target_post_date && (
              <span className="text-[12px] text-text-faint shrink-0">
                {new Date(idea.target_post_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[16px] font-semibold text-text mb-2 leading-snug">{idea.title}</h3>

          {/* Hook */}
          {idea.hook && !compact && (
            <p className="text-[13px] text-text-dim leading-relaxed mb-4 line-clamp-2">
              {idea.hook}
            </p>
          )}

          {/* Progress dots */}
          {!compact && (
            <div className="flex items-center gap-1.5 mt-3" aria-label="Progress">
              {LIFECYCLE_STAGES.map((stage, i) => (
                <div
                  key={stage}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors duration-300',
                    i < stageIdx
                      ? 'bg-purple'
                      : i === stageIdx
                      ? 'bg-purple scale-110'
                      : 'bg-border-default'
                  )}
                  title={stage.replace(/_/g, ' ')}
                />
              ))}
            </div>
          )}

          {/* "Click to review" hint */}
          {isActionable && !expanded && (
            <p className="mt-3 text-[12px] text-purple/70">Click to review brief →</p>
          )}
        </div>

        {/* Expanded brief */}
        {expanded && isActionable && (
          <div
            className="border-t border-border-default px-5 pb-5 pt-4 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Shot list */}
            {idea.shot_list && (
              <div className="mb-4">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
                  Shot list
                </p>
                <div className="text-[13px] text-text-dim leading-relaxed whitespace-pre-line">
                  {idea.shot_list}
                </div>
              </div>
            )}

            {/* Reference clip */}
            {idea.reference_url && (
              <div className="mb-4">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
                  Reference
                </p>
                <a
                  href={idea.reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple text-[13px] hover:underline"
                >
                  {idea.reference_url}
                </a>
              </div>
            )}

            {/* Caption direction */}
            {idea.caption_direction && (
              <div className="mb-5">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
                  Caption direction
                </p>
                <p className="text-[13px] text-text-dim leading-relaxed">{idea.caption_direction}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                loading={actionLoading === 'approve'}
              >
                ✓ Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestChanges}
                loading={actionLoading === 'changes'}
              >
                Request changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
