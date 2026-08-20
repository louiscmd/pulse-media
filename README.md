# Pulse Media — Client Portal

A production-quality client portal for the Pulse Media agency. Clients review content ideas, upload footage, track edits, and monitor ad & social performance — all in one dark-themed dashboard.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS with custom design tokens |
| Backend | Supabase (Postgres + RLS + Realtime + Auth + Storage) |
| Hosting | Vercel |
| Charts | Recharts |
| Email | Resend |
| Integrations | Google Drive Picker API, Meta Marketing API, TikTok Ads API, Instagram Graph API |

## Setup

### 1. Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the migration: `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Copy your project URL and keys

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see `.env.local.example` for the full list.

### 3. Local dev

```bash
npm install
npm run dev
```

### 4. Vercel deployment

1. Import this repo from [vercel.com/new](https://vercel.com/new)
2. Add all env vars from `.env.local.example` to the Vercel project settings
3. Deploy — every push to `main` auto-deploys

## Architecture

```
src/
  app/
    (app)/          # Authenticated routes (Home, Content, Comms, Reports, Edit Review, Settings)
    login/          # Public login page
    onboarding/     # 14-step first-run wizard
    auth/callback/  # Supabase OAuth callback
    api/            # Route handlers (metrics cron, Drive webhooks, etc.)
  components/
    ui/             # Button, Input, Chip, StatTile, StatusBadge
    nav/            # TopNav
    content/        # IdeaCard
    reports/        # GrowthChart
  lib/
    supabase/       # Client, server, and proxy (auth middleware) helpers
    utils.ts        # Shared formatting + tween utilities
  types/
    database.ts     # Full TypeScript types matching the Supabase schema
supabase/
  migrations/       # SQL schema with RLS policies
```

## RLS testing

Before onboarding real clients, verify isolation:

```sql
-- Log in as client A, then:
select * from content_ideas;  -- should only return client A's rows

-- Repeat as client B — should return only B's rows
```

The `is_agency()` helper grants full bypass to users with `app_metadata.role = 'agency'`.
Set this in the Supabase dashboard: Authentication → Users → Edit user → Raw App Metadata → `{ "role": "agency" }`.

## Google Drive setup

1. Enable Drive API + Picker API in Google Cloud Console
2. Create OAuth 2.0 credentials (Web application type)
3. Set redirect URI to `{your-domain}/api/auth/google/callback`
4. Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_PICKER_API_KEY` to env

## Ad metrics cron

Set up a Vercel Cron job in `vercel.json` to call `/api/metrics/sync` every 20 minutes.
The route hits Meta Marketing API + TikTok Ads API and writes to `ad_metrics_daily`.
A second cron hits `/api/metrics/social` for Instagram/TikTok organic data.
