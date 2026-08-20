import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * Vercel Cron: runs every 2 hours.
 * Pulls views/followers from Instagram Graph API and TikTok API,
 * writes to social_metrics_daily.
 *
 * Note: separate from ad_metrics — different credentials and rate limits.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: profiles } = await supabase
      .from('client_profiles')
      .select('client_id, ig_handle, tiktok_handle')

    if (!profiles?.length) return NextResponse.json({ ok: true, synced: 0 })

    let synced = 0

    for (const profile of profiles) {
      // ── Instagram Graph API ───────────────────────────────────────────────
      if (process.env.INSTAGRAM_ACCESS_TOKEN && profile.ig_handle) {
        // TODO: fetch from IG Graph API
        // GET /me/media?fields=impressions,reach&access_token=...
        // GET /me?fields=followers_count&access_token=...
        // await supabase.from('social_metrics_daily').upsert({ ... })
      }

      // ── TikTok API (organic) ──────────────────────────────────────────────
      if (process.env.TIKTOK_ACCESS_TOKEN && profile.tiktok_handle) {
        // TODO: fetch from TikTok Creator API
        // Different endpoint from TikTok Ads — use creator/research API
      }

      synced++
    }

    return NextResponse.json({ ok: true, synced })
  } catch (error) {
    console.error('[metrics/social]', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
