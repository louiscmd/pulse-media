'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn, relativeTime } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import type { ContentIdea, IdeaComment } from '@/types/database'

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
  comments?: IdeaComment[]
  onApprove?: (id: string) => Promise<void>
  onRequestChanges?: (id: string, note: string) => Promise<void>
  onCommentAdded?: () => void
  compact?: boolean
}

export default function IdeaCard({
  idea,
  comments = [],
  onApprove,
  onRequestChanges,
  onCommentAdded,
  compact,
}: IdeaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [actionLoading, setActionLoading] = useState<'approve' | 'changes' | null>(null)
  const [changeNote, setChangeNote] = useState('')
  const [showChangeNote, setShowChangeNote] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState<IdeaComment[]>(comments)
  const supabase = createClient()

  const stageIdx = STAGE_INDEX[idea.status] ?? 0
  const isActionable = idea.status === 'awaiting_review'

  // Lazy load userId when card is expanded
  async function ensureUserId() {
    if (userId) return userId
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
    return user?.id ?? null
  }

  async function handleApprove() {
    if (!onApprove) return
    setActionLoading('approve')
    await onApprove(idea.id)
    setActionLoading(null)
    setExpanded(false)
    setShowChangeNote(false)
  }

  async function handleRequestChanges() {
    if (!onRequestChanges) return
    setActionLoading('changes')
    await onRequestChanges(idea.id, changeNote.trim())
    setActionLoading(null)
    setExpanded(false)
    setShowChangeNote(false)
    setChangeNote('')
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmittingComment(true)
    const uid = await ensureUserId()
    if (!uid) { setSubmittingComment(false); return }

    const { data } = await supabase
      .from('idea_comments')
      .insert({ idea_id: idea.id, author_id: uid, body: newComment.trim() })
      .select()
      .single()

    if (data) {
      setLocalComments((prev) => [...prev, data as IdeaComment])
      onCommentAdded?.()
    }
    setNewComment('')
    setSubmittingComment(false)
  }

  const visibleComments = expanded ? localComments : []

  return (
    <div
      className={cn(
        'bg-panel rounded-card border transition-all duration-200 overflow-hidden',
        'border-[1.4px]',
        idea.status === 'awaiting_review'
          ? 'border-purple-soft shadow-[0_8px_30px_-18px_rgba(155,92,255,0.18)]'
          : 'border-border-default',
        isActionable && 'hover:shadow-[0_12px_40px_-14px_rgba(155,92,255,0.28)] hover:border-purple/50'
      )}
    >
      {/* ── Main card body ── */}
      <div
        className={cn('p-5', !compact && 'cursor-pointer')}
        onClick={() => !compact && setExpanded((v) => !v)}
        role={!compact ? 'button' : undefined}
        tabIndex={!compact ? 0 : undefined}
        onKeyDown={(e) => !compact && e.key === 'Enter' && setExpanded((v) => !v)}
        aria-expanded={!compact ? expanded : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={idea.status} />
          <div className="flex items-center gap-2 shrink-0">
            {localComments.length > 0 && !compact && (
              <span className="text-[11.5px] text-text-faint">
                {localComments.length} note{localComments.length !== 1 ? 's' : ''}
              </span>
            )}
            {idea.target_post_date && (
              <span className="text-[12px] text-text-faint">
                {new Date(idea.target_post_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
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
                  'rounded-full transition-all duration-300',
                  i < stageIdx
                    ? 'w-2 h-2 bg-purple'
                    : i === stageIdx
                    ? 'w-2.5 h-2.5 bg-purple scale-110'
                    : 'w-2 h-2 bg-border-default'
                )}
                title={stage.replace(/_/g, ' ')}
              />
            ))}
          </div>
        )}

        {/* Expand hint */}
        {!compact && !expanded && (
          <p className="mt-3 text-[12px] text-text-faint">
            {isActionable ? 'Click to review brief →' : 'Click to see details & notes →'}
          </p>
        )}
      </div>

      {/* ── Expanded detail ── */}
      {expanded && !compact && (
        <div
          className="border-t border-border-default animate-fade-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 pb-5 pt-4 space-y-5">
            {/* Shot list */}
            {idea.shot_list && (
              <div>
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
              <div>
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
              <div>
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">
                  Caption direction
                </p>
                <p className="text-[13px] text-text-dim leading-relaxed">{idea.caption_direction}</p>
              </div>
            )}

            {/* Approval actions */}
            {isActionable && (
              <div className="pt-2 space-y-3">
                {/* Change note textarea — shown when user clicks "Request changes" */}
                {showChangeNote && (
                  <div className="animate-fade-up">
                    <textarea
                      value={changeNote}
                      onChange={(e) => setChangeNote(e.target.value)}
                      autoFocus
                      placeholder="What needs changing? (optional but helpful)"
                      rows={3}
                      className="w-full bg-panel-2 border border-amber/30 rounded-xl px-4 py-2.5 text-[13px] text-text placeholder:text-text-faint focus:outline-none focus:border-amber/60 transition-colors resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleApprove}
                    loading={actionLoading === 'approve'}
                  >
                    ✓ Approve
                  </Button>
                  {!showChangeNote ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowChangeNote(true)}
                    >
                      Request changes
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRequestChanges}
                        loading={actionLoading === 'changes'}
                      >
                        Submit feedback
                      </Button>
                      <button
                        onClick={() => { setShowChangeNote(false); setChangeNote('') }}
                        className="text-[12.5px] text-text-faint hover:text-text transition-colors px-2"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Notes / comments ── */}
            <div className="pt-2 border-t border-border-default space-y-3">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint">
                Notes
              </p>

              {localComments.length > 0 ? (
                <div className="space-y-2">
                  {localComments.map((c) => (
                    <div key={c.id} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-[11px] font-semibold text-purple shrink-0 mt-0.5">
                        C
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-text leading-relaxed break-words">{c.body}</p>
                        <p className="text-[11px] text-text-faint mt-0.5">{relativeTime(c.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-faint text-[12.5px]">No notes yet.</p>
              )}

              {/* Add note */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a note…"
                  className="flex-1 bg-panel-2 border border-border-default rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:outline-none focus:border-purple-soft transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #b47cff, #7c3dff)' }}
                >
                  ↑
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
