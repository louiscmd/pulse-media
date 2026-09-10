'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Edit, EditComment, ContentIdea } from '@/types/database'
import { relativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/ui/StatusBadge'

type EditWithIdea = Edit & { content_idea: ContentIdea }

export default function EditReviewPage() {
  const [edits, setEdits] = useState<EditWithIdea[]>([])
  const [selectedEdit, setSelectedEdit] = useState<EditWithIdea | null>(null)
  const [comments, setComments] = useState<EditComment[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [timestampSeconds, setTimestampSeconds] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<'approve' | 'changes' | null>(null)
  const [approvalNote, setApprovalNote] = useState('')
  const [showChangesInput, setShowChangesInput] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const commentsBottomRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!client) return

      // First fetch all idea IDs for this client, then filter edits by those
      const { data: ideaIds } = await supabase
        .from('content_ideas')
        .select('id')
        .eq('client_id', client.id)

      if (!ideaIds || ideaIds.length === 0) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('edits')
        .select('*, content_idea:content_idea_id(*)')
        .in('content_idea_id', ideaIds.map((r) => r.id))
        .order('created_at', { ascending: false })

      const typed = (data ?? []) as unknown as EditWithIdea[]
      setEdits(typed)

      // Select the first pending review, or the most recent if all done
      const pending = typed.find((e) => e.status === 'in_review')
      setSelectedEdit(pending ?? typed[0] ?? null)
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedEdit) return
    setShowChangesInput(false)
    setApprovalNote('')
    fetchComments()
  }, [selectedEdit?.id])

  useEffect(() => {
    commentsBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function fetchComments() {
    if (!selectedEdit) return
    const { data } = await supabase
      .from('edit_comments')
      .select('*')
      .eq('edit_id', selectedEdit.id)
      .order('timestamp_seconds')
    setComments(data ?? [])
  }

  function captureTimestamp() {
    setTimestampSeconds(Math.floor(videoRef.current?.currentTime ?? 0))
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!newComment.trim() || !selectedEdit || !userId) return

    await supabase.from('edit_comments').insert({
      edit_id: selectedEdit.id,
      author_id: userId,
      timestamp_seconds: timestampSeconds,
      body: newComment.trim(),
    })

    setNewComment('')
    await fetchComments()
  }

  async function handleApprove() {
    if (!selectedEdit) return
    setActionLoading('approve')
    await supabase
      .from('edits')
      .update({ status: 'approved' })
      .eq('id', selectedEdit.id)

    await supabase
      .from('content_ideas')
      .update({ status: 'ready_to_post' })
      .eq('id', selectedEdit.content_idea.id)

    // If there's an approval note, add it as a comment at 0:00
    if (approvalNote.trim() && userId) {
      await supabase.from('edit_comments').insert({
        edit_id: selectedEdit.id,
        author_id: userId,
        timestamp_seconds: 0,
        body: `✓ Approved — ${approvalNote.trim()}`,
      })
    }

    setActionLoading(null)
    setEdits((prev) => prev.map((e) => e.id === selectedEdit.id ? { ...e, status: 'approved' } : e))
    setSelectedEdit((e) => e ? { ...e, status: 'approved' } : e)
    setApprovalNote('')
    await fetchComments()
  }

  async function handleRequestChanges() {
    if (!selectedEdit) return
    setActionLoading('changes')
    await supabase
      .from('edits')
      .update({ status: 'changes_requested' })
      .eq('id', selectedEdit.id)

    // Save the feedback note as a comment
    if (approvalNote.trim() && userId) {
      await supabase.from('edit_comments').insert({
        edit_id: selectedEdit.id,
        author_id: userId,
        timestamp_seconds: 0,
        body: `↩ Changes requested — ${approvalNote.trim()}`,
      })
    }

    setActionLoading(null)
    setShowChangesInput(false)
    setApprovalNote('')
    setEdits((prev) => prev.map((e) => e.id === selectedEdit.id ? { ...e, status: 'changes_requested' } : e))
    setSelectedEdit((e) => e ? { ...e, status: 'changes_requested' } : e)
    await fetchComments()
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-semibold text-text">Edit Review</h1>
        <p className="text-text-dim text-[13.5px] mt-1">
          Watch your edits, leave timestamped feedback, and approve when ready.
        </p>
      </div>

      {edits.length === 0 ? (
        <div className="bg-panel border border-border-default rounded-card p-12 text-center">
          <p className="text-text-dim text-[14px]">No edits to review right now.</p>
          <p className="text-text-faint text-[13px] mt-1">
            Your Socialy team will upload edited cuts here once footage is received.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: video + actions */}
          <div className="space-y-4">
            {/* Edit selector */}
            <div className="flex gap-2 flex-wrap">
              {edits.map((edit) => (
                <button
                  key={edit.id}
                  onClick={() => setSelectedEdit(edit)}
                  className={cn(
                    'px-3.5 py-2 rounded-pill text-[12.5px] font-medium border transition-all duration-150',
                    selectedEdit?.id === edit.id
                      ? 'bg-purple/15 border-purple-soft text-purple'
                      : 'border-border-default text-text-dim hover:border-purple-soft hover:text-text'
                  )}
                >
                  {edit.content_idea?.title ?? 'Edit'} — v{edit.version}
                  {edit.status === 'in_review' && (
                    <span className="ml-2 w-1.5 h-1.5 rounded-full bg-amber inline-block" />
                  )}
                </button>
              ))}
            </div>

            {selectedEdit && (
              <>
                {/* Video */}
                <div className="bg-panel-2 border border-border-default rounded-card overflow-hidden">
                  {selectedEdit.video_url ? (
                    <video
                      ref={videoRef}
                      src={selectedEdit.video_url}
                      controls
                      className="w-full aspect-video"
                      onTimeUpdate={captureTimestamp}
                    />
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <p className="text-text-faint text-[13.5px]">Video URL not set</p>
                    </div>
                  )}
                </div>

                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[17px] font-semibold text-text">
                      {selectedEdit.content_idea?.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge status={selectedEdit.status} />
                      <span className="text-text-faint text-[12.5px]">
                        Revision {selectedEdit.version}
                        {selectedEdit.content_idea?.revision_count > 0
                          ? ` of ${selectedEdit.content_idea.revision_count + 1}`
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {selectedEdit.status === 'in_review' && (
                  <div className="bg-panel border border-border-default rounded-card p-5 space-y-4">
                    <p className="text-[13.5px] font-semibold text-text">
                      Ready to make a decision?
                    </p>

                    {/* Optional note */}
                    <textarea
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="Add a note (optional) — e.g. 'Love the colour grade' or 'Please shorten the intro by 3 seconds'"
                      rows={2}
                      className="w-full bg-panel-2 border border-border-default rounded-xl px-4 py-2.5 text-[13px] text-text placeholder:text-text-faint focus:outline-none focus:border-purple-soft transition-colors resize-none"
                    />

                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        loading={actionLoading === 'approve'}
                      >
                        ✓ Approve this edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleRequestChanges}
                        loading={actionLoading === 'changes'}
                      >
                        Request changes
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEdit.status === 'approved' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-green/5 border border-green/20 rounded-xl text-green text-[13.5px]">
                    <span>✓</span>
                    <span>Approved — this cut is going live</span>
                  </div>
                )}

                {selectedEdit.status === 'changes_requested' && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-amber/5 border border-amber/20 rounded-xl text-amber text-[13.5px]">
                    <span>↩</span>
                    <span>Changes requested — your Socialy editor will revise and re-upload</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: timestamped comments */}
          <div
            className="bg-panel border border-border-default rounded-card flex flex-col overflow-hidden"
            style={{ height: 'fit-content', maxHeight: '70vh' }}
          >
            <div className="px-4 py-3.5 border-b border-border-default">
              <p className="text-[15px] font-semibold text-text">Comments</p>
              <p className="text-text-faint text-[12px] mt-0.5">
                Pause at any moment and add a timestamped note
              </p>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <p className="text-text-faint text-[13px] text-center py-6">
                  No comments yet. Pause the video and add feedback below.
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <button
                      className="shrink-0 text-[11.5px] font-semibold text-purple bg-purple/10 border border-purple-soft rounded px-1.5 py-0.5 hover:bg-purple/20 transition-colors"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = comment.timestamp_seconds
                          videoRef.current.pause()
                        }
                      }}
                      title="Jump to this moment"
                    >
                      {formatTime(comment.timestamp_seconds)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-text text-[13px] leading-relaxed break-words">{comment.body}</p>
                      <p className="text-text-faint text-[11px] mt-0.5">{relativeTime(comment.created_at)}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsBottomRef} />
            </div>

            {/* Add comment */}
            <form onSubmit={addComment} className="p-3 border-t border-border-default">
              <div className="text-[11.5px] text-text-faint mb-1.5 px-1">
                At {formatTime(timestampSeconds)}
              </div>
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add timestamped note…"
                  className="flex-1 bg-panel-2 border border-border-default rounded-xl px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:outline-none focus:border-purple-soft transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #1DD9C5, #0CBCAA)' }}
                >
                  ↑
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
