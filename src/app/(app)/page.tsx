import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatTile from '@/components/ui/StatTile'
import IdeaCard from '@/components/content/IdeaCard'
import type { ContentIdea, AdMetricsDaily } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .single()

  if (!client) redirect('/onboarding')

  // Parallel data fetches
  const [
    { data: ideas },
    { data: adMetrics },
    { data: allIdeas },
    { data: pendingEdits },
  ] = await Promise.all([
    // Next 3 ideas by target_post_date
    supabase
      .from('content_ideas')
      .select('*')
      .eq('client_id', client.id)
      .not('status', 'in', '("posted")')
      .order('target_post_date', { ascending: true })
      .limit(3),

    // Ad metrics for current month
    supabase
      .from('ad_metrics_daily')
      .select('spend, roas, ctr, cpp, date')
      .eq('client_id', client.id)
      .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
      .order('date', { ascending: false }),

    // All ideas for stat counts
    supabase
      .from('content_ideas')
      .select('id, status')
      .eq('client_id', client.id),

    // Edits pending client review
    supabase
      .from('edits')
      .select('id')
      .eq('status', 'in_review')
      .in(
        'content_idea_id',
        (await supabase.from('content_ideas').select('id').eq('client_id', client.id))
          .data?.map((r) => r.id) ?? []
      ),
  ])

  const ideasToReview = allIdeas?.filter((i) => i.status === 'awaiting_review').length ?? 0
  const footageNeeded = allIdeas?.filter((i) => i.status === 'footage_needed').length ?? 0
  const editsReady = allIdeas?.filter((i) => i.status === 'ready_to_post').length ?? 0
  const pendingEditCount = pendingEdits?.length ?? 0

  const totalSpend = adMetrics?.reduce((sum, m) => sum + (m.spend ?? 0), 0) ?? 0
  const avgRoas = adMetrics?.length
    ? adMetrics.reduce((sum, m) => sum + (m.roas ?? 0), 0) / adMetrics.length
    : null
  const avgCtr = adMetrics?.length
    ? adMetrics.reduce((sum, m) => sum + (m.ctr ?? 0), 0) / adMetrics.length
    : null

  const lastUpdated = adMetrics?.[0]?.date ? new Date(adMetrics[0].date) : new Date()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-semibold text-text">Welcome back, {client.name}.</h1>
        <p className="text-text-dim mt-1 text-[13.5px]">Here's where things stand this week.</p>
      </div>

      {/* Pending edits callout */}
      {pendingEditCount > 0 && (
        <Link
          href="/edit-review"
          className="flex items-center justify-between px-5 py-4 rounded-card border border-amber/25 bg-amber/5 hover:bg-amber/8 hover:border-amber/40 transition-all duration-150 group"
        >
          <div className="flex items-center gap-3">
            <span className="text-amber text-[18px]">▶</span>
            <div>
              <p className="text-[14px] font-semibold text-text">
                {pendingEditCount === 1
                  ? '1 edit is ready for your review'
                  : `${pendingEditCount} edits are ready for your review`}
              </p>
              <p className="text-[12.5px] text-text-dim mt-0.5">
                Watch and approve (or request changes) to keep production moving.
              </p>
            </div>
          </div>
          <span className="text-text-faint text-[13px] group-hover:text-text transition-colors">
            Review →
          </span>
        </Link>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Ideas to review" value={ideasToReview} accent />
        <StatTile label="Footage needed" value={footageNeeded} />
        <StatTile label="Edits to review" value={pendingEditCount} accent={pendingEditCount > 0} />
        <StatTile
          label="Ad spend MTD"
          value={`$${Math.round(totalSpend).toLocaleString()}`}
          live
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Content ideas preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-semibold text-text">This month's content ideas</h2>
          <Link href="/content" className="text-purple text-[13px] hover:underline">
            View all →
          </Link>
        </div>

        {!ideas || ideas.length === 0 ? (
          <div className="bg-panel border border-border-default rounded-card p-8 text-center">
            <p className="text-text-dim text-[14px]">No content ideas yet.</p>
            <p className="text-text-faint text-[13px] mt-1">
              Your Socialy team will publish your first batch within 48 hours of setup.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {ideas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea as ContentIdea} compact />
            ))}
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Drive connection */}
        <div className="bg-panel border border-border-default rounded-card p-5">
          <h2 className="text-[16px] font-semibold text-text mb-4">Footage upload</h2>
          <DriveStatusPanel clientId={client.id} />
        </div>

        {/* Ads snapshot */}
        <div className="bg-panel border border-border-default rounded-card p-5">
          <h2 className="text-[16px] font-semibold text-text mb-4">Ads snapshot</h2>
          {adMetrics && adMetrics.length > 0 ? (
            <div className="space-y-3">
              {[
                { label: 'Spend MTD', value: `$${Math.round(totalSpend).toLocaleString()}` },
                { label: 'ROAS', value: avgRoas ? `${avgRoas.toFixed(2)}x` : '—' },
                { label: 'CTR', value: avgCtr ? `${(avgCtr * 100).toFixed(2)}%` : '—' },
                {
                  label: 'Cost per purchase',
                  value: adMetrics[0]?.cpp ? `$${adMetrics[0].cpp.toFixed(2)}` : '—',
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                  <span className="text-text-dim text-[13px]">{label}</span>
                  <span className="text-text font-semibold text-[14px]">{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-faint text-[13px]">
              Ad data will appear here once your campaigns are live.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function DriveStatusPanel({ clientId }: { clientId: string }) {
  // This would check a drive_connections table in a real implementation
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-green" />
        <span className="text-[13px] text-text-dim">
          Connected to Google Drive
        </span>
      </div>
      <Link href="/content">
        <button className="w-full text-left px-4 py-3 bg-panel-2 border border-border-default rounded-xl text-[13px] text-text-dim hover:border-purple-soft hover:text-text transition-all duration-150">
          Upload footage →
        </button>
      </Link>
    </div>
  )
}
