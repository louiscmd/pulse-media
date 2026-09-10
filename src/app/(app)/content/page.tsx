'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import IdeaCard from '@/components/content/IdeaCard'
import type { ContentIdea, FootageAsset, IdeaComment } from '@/types/database'
import { relativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_review', label: 'Awaiting review' },
  { value: 'approved', label: 'Approved' },
  { value: 'footage_needed', label: 'Footage needed' },
  { value: 'in_editing', label: 'In editing' },
  { value: 'ready_to_post', label: 'Ready to post' },
  { value: 'posted', label: 'Posted' },
]

export default function ContentPage() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([])
  const [commentsByIdea, setCommentsByIdea] = useState<Record<string, IdeaComment[]>>({})
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [footageIdea, setFootageIdea] = useState<ContentIdea | null>(null)
  const [footageAssets, setFootageAssets] = useState<FootageAsset[]>([])

  const supabase = createClient()

  const fetchIdeas = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (!client) return

    setClientId(client.id)

    const { data } = await supabase
      .from('content_ideas')
      .select('*')
      .eq('client_id', client.id)
      .order('target_post_date', { ascending: true })

    const fetchedIdeas = data ?? []
    setIdeas(fetchedIdeas)
    setLoading(false)

    // Find the first idea that needs footage
    const needsFootage = fetchedIdeas.find((i) => i.status === 'footage_needed')
    setFootageIdea(needsFootage ?? null)

    if (needsFootage) {
      const { data: assets } = await supabase
        .from('footage_assets')
        .select('*')
        .eq('content_idea_id', needsFootage.id)
        .order('synced_at', { ascending: false })
      setFootageAssets(assets ?? [])
    }
  }, [])

  const fetchComments = useCallback(async (ideaIds: string[]) => {
    if (ideaIds.length === 0) return
    const { data } = await supabase
      .from('idea_comments')
      .select('*')
      .in('idea_id', ideaIds)
      .order('created_at')

    const grouped: Record<string, IdeaComment[]> = {}
    for (const c of data ?? []) {
      if (!grouped[c.idea_id]) grouped[c.idea_id] = []
      grouped[c.idea_id].push(c as IdeaComment)
    }
    setCommentsByIdea(grouped)
  }, [])

  useEffect(() => {
    fetchIdeas()

    const sub = supabase
      .channel('content_ideas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_ideas' }, fetchIdeas)
      .subscribe()

    return () => { supabase.removeChannel(sub) }
  }, [fetchIdeas])

  // Fetch comments once ideas are loaded
  useEffect(() => {
    if (ideas.length > 0) {
      fetchComments(ideas.map((i) => i.id))
    }
  }, [ideas, fetchComments])

  async function handleApprove(id: string) {
    await supabase
      .from('content_ideas')
      .update({ status: 'approved' })
      .eq('id', id)
    await fetchIdeas()
  }

  async function handleRequestChanges(id: string, note: string) {
    const idea = ideas.find((i) => i.id === id)
    await supabase
      .from('content_ideas')
      .update({
        status: 'draft',
        revision_count: (idea?.revision_count ?? 0) + 1,
      })
      .eq('id', id)

    // If the client left a note, save it as an idea comment
    if (note) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('idea_comments').insert({
          idea_id: id,
          author_id: user.id,
          body: `↩ Changes requested — ${note}`,
        })
      }
    }

    await fetchIdeas()
    await fetchComments(ideas.map((i) => i.id))
  }

  const filtered = filter === 'all' ? ideas : ideas.filter((i) => i.status === filter)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-text">Content</h1>
        <p className="text-text-dim mt-1 text-[13.5px]">
          Review ideas, approve briefs, and track footage through to posting.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              'px-3.5 py-1.5 rounded-pill text-[12.5px] font-medium border transition-all duration-150',
              filter === value
                ? 'bg-purple/15 border-purple-soft text-purple'
                : 'bg-transparent border-border-default text-text-dim hover:text-text hover:border-purple-soft'
            )}
          >
            {label}
            {value !== 'all' && (
              <span className="ml-1.5 text-text-faint">
                ({ideas.filter((i) => i.status === value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Ideas grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-panel border border-border-default rounded-card h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-panel border border-border-default rounded-card p-12 text-center">
          <p className="text-text-dim text-[14px] font-medium">No ideas in this category yet.</p>
          <p className="text-text-faint text-[13px] mt-1">
            {filter === 'all'
              ? 'Your Socialy team will publish your first batch within 48 hours.'
              : `Nothing is ${filter.replace(/_/g, ' ')} right now.`}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              comments={commentsByIdea[idea.id] ?? []}
              onApprove={handleApprove}
              onRequestChanges={handleRequestChanges}
              onCommentAdded={() => fetchComments(ideas.map((i) => i.id))}
            />
          ))}
        </div>
      )}

      {/* Footage upload panel */}
      <div className="bg-panel border border-border-default rounded-card p-6">
        <h2 className="text-[17px] font-semibold text-text mb-1">Footage upload</h2>
        <p className="text-text-faint text-[13px] mb-5">
          Upload your raw clips directly to the shared Drive folder for the idea that needs footage.
        </p>

        {footageIdea ? (
          <DriveUploadPanel idea={footageIdea} assets={footageAssets} />
        ) : (
          <div className="text-center py-6">
            <p className="text-text-dim text-[13.5px]">No ideas are waiting on footage right now.</p>
            <p className="text-text-faint text-[12px] mt-1">
              Approve an idea and mark it as filming-ready to see the upload panel here.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function DriveUploadPanel({
  idea,
  assets,
}: {
  idea: ContentIdea
  assets: FootageAsset[]
}) {
  return (
    <div>
      {/* Connection status */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex items-center justify-center w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-green animate-pulse-ring opacity-60" />
          <span className="relative w-2 h-2 rounded-full bg-green" />
        </div>
        <span className="text-[13px] text-text-dim">Connected to Google Drive</span>
      </div>

      {/* Breadcrumb */}
      <div className="text-[12.5px] text-text-faint mb-4 font-mono bg-panel-2 border border-border-default rounded-lg px-4 py-2.5">
        Shared Drive › <span className="text-text-dim">Raw Footage</span> ›{' '}
        <span className="text-text">{idea.title}</span>
      </div>

      {/* Upload button */}
      <button
        className="w-full sm:w-auto px-5 py-2.5 rounded-pill text-[13.5px] font-semibold border border-purple-soft text-purple bg-purple/10 hover:bg-purple/15 transition-all duration-150 mb-5"
        onClick={() => {
          alert('Google Picker API integration — configure GOOGLE_PICKER_API_KEY in env vars.')
        }}
      >
        ↑ Upload files to this Drive folder
      </button>

      {/* Synced files */}
      {assets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-3">
            Synced files
          </p>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="flex items-center gap-3 px-4 py-2.5 bg-panel-2 border border-border-default rounded-xl"
            >
              <span className="text-green text-sm">✓</span>
              <span className="text-[13px] text-text flex-1 truncate">{asset.drive_file_name}</span>
              <span className="text-[12px] text-text-faint shrink-0">
                synced {relativeTime(asset.synced_at)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-text-faint text-[13px]">No files synced yet.</p>
      )}
    </div>
  )
}
