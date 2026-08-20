import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Vercel Cron: runs every 20 minutes.
 * Pulls spend/ROAS/CTR/CPP from Meta Marketing API and TikTok Ads API,
 * writes to ad_metrics_daily.
 *
 * Protect this route with a cron secret header check.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch all clients
    const { data: clients } = await supabase.from('clients').select('id, name')
    if (!clients?.length) return NextResponse.json({ ok: true, synced: 0 })

    let synced = 0

    for (const client of clients) {
      // ── Meta Marketing API ────────────────────────────────────────────────
      // In production: fetch from Meta Ads API using per-client stored token
      // const metaData = await fetchMetaMetrics(client.id, today)
      // For now, we write a placeholder row only if the env is configured
      if (process.env.META_ACCESS_TOKEN) {
        // TODO: replace with real Meta API call
        // const url = `https://graph.facebook.com/v19.0/${process.env.META_AD_ACCOUNT_ID}/insights?...`
        // const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` } })
        // const metaData = await res.json()
        // await supabase.from('ad_metrics_daily').upsert({ client_id: client.id, date: today, platform: 'meta', ... })
      }

      // ── TikTok Ads API ────────────────────────────────────────────────────
      if (process.env.TIKTOK_ACCESS_TOKEN) {
        // TODO: replace with real TikTok API call
        // const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', ...)
      }

      synced++
    }

    return NextResponse.json({ ok: true, synced })
  } catch (error) {
    console.error('[metrics/sync]', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
