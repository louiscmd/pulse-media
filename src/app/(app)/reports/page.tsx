'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GrowthChart from '@/components/reports/GrowthChart'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { AdMetricsDaily, SocialMetricsDaily, ContentIdea } from '@/types/database'
import Button from '@/components/ui/Button'

type Period = 'week' | 'month'

function getDateRange(period: Period) {
  const now = new Date()
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end }
  } else {
    const dayOfWeek = now.getDay()
    const start = new Date(now)
    start.setDate(now.getDate() - dayOfWeek)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }
}

function getPriorRange(period: Period, start: Date) {
  if (period === 'month') {
    const priorStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
    const priorEnd = new Date(start.getFullYear(), start.getMonth(), 0)
    return { start: priorStart, end: priorEnd }
  } else {
    const priorStart = new Date(start)
    priorStart.setDate(start.getDate() - 7)
    const priorEnd = new Date(start)
    priorEnd.setDate(start.getDate() - 1)
    return { start: priorStart, end: priorEnd }
  }
}

function formatDateLabel(period: Period, start: Date, end: Date) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  if (period === 'month') {
    return `${monthNames[start.getMonth()]} ${start.getFullYear()} Report`
  }
  return `Week of ${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [loading, setLoading] = useState(true)
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [adMetrics, setAdMetrics] = useState<AdMetricsDaily[]>([])
  const [priorAdMetrics, setPriorAdMetrics] = useState<AdMetricsDaily[]>([])
  const [socialMetrics, setSocialMetrics] = useState<SocialMetricsDaily[]>([])
  const [priorSocialMetrics, setPriorSocialMetrics] = useState<SocialMetricsDaily[]>([])
  const [postedIdeas, setPostedIdeas] = useState<ContentIdea[]>([])
  const [approvedIdeas, setApprovedIdeas] = useState<{ id: string }[]>([])
  const [reportNotes, setReportNotes] = useState<string | null>(null)

  const { start, end } = getDateRange(period)
  const { start: priorStart, end: priorEnd } = getPriorRange(period, start)

  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: client } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', user.id)
        .single()
      if (!client) return

      setClientId(client.id)
      setClientName(client.name)

      const [
        { data: ads },
        { data: priorAds },
        { data: social },
        { data: priorSocial },
        { data: posted },
        { data: approved },
        { data: report },
      ] = await Promise.all([
        supabase.from('ad_metrics_daily').select('*').eq('client_id', client.id)
          .gte('date', toISO(start)).lte('date', toISO(end)).order('date'),
        supabase.from('ad_metrics_daily').select('*').eq('client_id', client.id)
          .gte('date', toISO(priorStart)).lte('date', toISO(priorEnd)).order('date'),
        supabase.from('social_metrics_daily').select('*').eq('client_id', client.id)
          .gte('date', toISO(start)).lte('date', toISO(end)).order('date'),
        supabase.from('social_metrics_daily').select('*').eq('client_id', client.id)
          .gte('date', toISO(priorStart)).lte('date', toISO(priorEnd)).order('date'),
        supabase.from('content_ideas').select('*').eq('client_id', client.id)
          .eq('status', 'posted').gte('target_post_date', toISO(start)).lte('target_post_date', toISO(end)),
        supabase.from('content_ideas').select('id').eq('client_id', client.id)
          .in('status', ['approved', 'footage_needed', 'footage_received', 'in_editing', 'ready_to_post', 'posted'])
          .gte('created_at', toISO(start)).lte('created_at', toISO(end)),
        supabase.from('reports').select('notes').eq('client_id', client.id)
          .eq('period_type', period).gte('period_start', toISO(start)).single(),
      ])

      setAdMetrics(ads ?? [])
      setPriorAdMetrics(priorAds ?? [])
      setSocialMetrics(social ?? [])
      setPriorSocialMetrics(priorSocial ?? [])
      setPostedIdeas(posted ?? [])
      setApprovedIdeas(approved ?? [])
      setReportNotes(report?.notes ?? null)
      setLoading(false)
    }
    fetchData()
  }, [period])

  // Aggregate numbers
  const totalSpend = adMetrics.reduce((s, m) => s + m.spend, 0)
  const priorSpend = priorAdMetrics.reduce((s, m) => s + m.spend, 0)
  const spendDelta = priorSpend ? ((totalSpend - priorSpend) / priorSpend) * 100 : null

  const avgRoas = adMetrics.length
    ? adMetrics.reduce((s, m) => s + m.roas, 0) / adMetrics.length
    : null
  const avgCtr = adMetrics.length
    ? adMetrics.reduce((s, m) => s + m.ctr, 0) / adMetrics.length
    : null
  const avgCpp = adMetrics.length
    ? adMetrics.reduce((s, m) => s + m.cpp, 0) / adMetrics.length
    : null

  // Social aggregates
  const latestSocial = socialMetrics[socialMetrics.length - 1]
  const priorSocial = priorSocialMetrics[priorSocialMetrics.length - 1]

  const currentViews = socialMetrics.reduce((s, m) => s + m.views, 0)
  const priorViews = priorSocialMetrics.reduce((s, m) => s + m.views, 0)
  const viewsDelta = priorViews ? ((currentViews - priorViews) / priorViews) * 100 : null

  const currentFollowers = latestSocial?.followers ?? 0
  const priorFollowers = priorSocial?.followers ?? 0
  const followersDelta = priorFollowers
    ? ((currentFollowers - priorFollowers) / priorFollowers) * 100
    : null

  // Chart data
  const viewsData = socialMetrics.map((m) => ({
    date: m.date.slice(5),
    value: m.views,
  }))
  const followersData = socialMetrics.map((m) => ({
    date: m.date.slice(5),
    value: m.followers,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-semibold text-text">
            {formatDateLabel(period, start, end)}
          </h1>
          <p className="text-text-dim text-[13.5px] mt-1">
            {toISO(start)} – {toISO(end)} · {clientName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex items-center bg-panel-2 border border-border-default rounded-pill p-0.5">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-4 py-1.5 rounded-pill text-[13px] font-medium capitalize transition-all duration-150',
                  period === p
                    ? 'bg-purple/20 text-purple'
                    : 'text-text-dim hover:text-text'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => window.print()}>
            ↓ Download PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-panel border border-border-default rounded-[24px] h-52 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Growth charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <GrowthChart
              title="Views"
              data={viewsData}
              currentValue={currentViews}
              delta={viewsDelta ?? undefined}
            />
            <GrowthChart
              title="Followers"
              data={followersData}
              currentValue={currentFollowers}
              delta={followersDelta ?? undefined}
            />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Ideas approved', value: approvedIdeas.length },
              { label: 'Content shipped', value: postedIdeas.length },
              {
                label: 'Ad spend',
                value: formatCurrency(totalSpend),
                sub: spendDelta !== null ? formatPercent(spendDelta) : undefined,
                subColor: spendDelta !== null && spendDelta >= 0 ? 'text-green' : 'text-red',
              },
              { label: 'ROAS', value: avgRoas ? `${avgRoas.toFixed(2)}x` : '—' },
            ].map(({ label, value, sub, subColor }) => (
              <div key={label} className="bg-panel border border-border-default rounded-stat p-5 hover:border-purple-soft transition-colors duration-200">
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-text-faint mb-2">{label}</p>
                <p className="text-[22px] font-semibold text-text leading-none">{value}</p>
                {sub && <p className={cn('text-[12px] mt-1 font-medium', subColor)}>{sub} vs prior</p>}
              </div>
            ))}
          </div>

          {/* Ad performance detail */}
          <div className="bg-panel border border-border-default rounded-card p-6">
            <h2 className="text-[17px] font-semibold text-text mb-4">Ad performance</h2>
            {adMetrics.length === 0 ? (
              <p className="text-text-faint text-[13px]">No ad data for this period.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Spend', value: formatCurrency(totalSpend) },
                  { label: 'ROAS', value: avgRoas ? `${avgRoas.toFixed(2)}x` : '—' },
                  { label: 'CTR', value: avgCtr ? `${(avgCtr * 100).toFixed(2)}%` : '—' },
                  { label: 'Cost per purchase', value: avgCpp ? formatCurrency(avgCpp) : '—' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center py-2.5 border-b border-border-default last:border-0"
                  >
                    <span className="text-text-dim text-[13.5px]">{label}</span>
                    <span className="text-text font-semibold text-[15px]">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Content shipped */}
          <div className="bg-panel border border-border-default rounded-card p-6">
            <h2 className="text-[17px] font-semibold text-text mb-4">Content shipped</h2>
            {postedIdeas.length === 0 ? (
              <p className="text-text-faint text-[13px]">No content posted in this period yet.</p>
            ) : (
              <div className="space-y-2">
                {postedIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="flex items-center justify-between py-2.5 border-b border-border-default last:border-0"
                  >
                    <span className="text-text text-[13.5px] font-medium">{idea.title}</span>
                    <span className="text-text-faint text-[12.5px]">
                      {idea.target_post_date
                        ? new Date(idea.target_post_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* What's next */}
          {reportNotes && (
            <div className="bg-panel border border-border-default rounded-card p-6">
              <h2 className="text-[17px] font-semibold text-text mb-3">What's next</h2>
              <p className="text-text-dim text-[13.5px] leading-relaxed">{reportNotes}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
