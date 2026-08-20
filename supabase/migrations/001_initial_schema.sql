-- ============================================================
--  Pulse Media — Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── clients ─────────────────────────────────────────────────
create table clients (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  name                     text not null,
  brand_slug               text unique not null,
  onboarding_completed_at  timestamptz,
  created_at               timestamptz not null default now()
);

create unique index clients_user_id_idx on clients(user_id);

-- ─── client_profiles ─────────────────────────────────────────
create type drop_frequency as enum ('weekly', 'monthly', 'seasonal');
create type drop_style as enum ('themed_collections', 'standalone_pieces', 'mix');
create type posting_frequency as enum ('daily', '3-5_week', '1-2_week', 'few_month');

create table client_profiles (
  client_id              uuid primary key references clients(id) on delete cascade,
  brand_statement        text,
  customer_age_range     text,
  customer_notes         text,
  competitor_brands      text[],
  lookbook_url           text,
  drop_frequency         drop_frequency,
  drop_style             drop_style,
  pieces_per_drop        integer,
  price_point            text,
  sells_where            text[],
  filming_equipment      text,
  filming_help           text,
  filming_time_per_week  text,
  filming_locations      text,
  ig_handle              text,
  tiktok_handle          text,
  posting_frequency      posting_frequency,
  top_post_url           text,
  ads_history            text,
  ad_budget              text,
  success_definition     text[]
);

-- ─── content_ideas ───────────────────────────────────────────
create type content_status as enum (
  'draft',
  'awaiting_review',
  'approved',
  'footage_needed',
  'footage_received',
  'in_editing',
  'ready_to_post',
  'posted'
);

create table content_ideas (
  id                uuid primary key default uuid_generate_v4(),
  client_id         uuid not null references clients(id) on delete cascade,
  title             text not null,
  hook              text,
  shot_list         text,
  reference_url     text,
  caption_direction text,
  target_post_date  date,
  status            content_status not null default 'draft',
  revision_count    integer not null default 0,
  drive_folder_id   text,
  created_at        timestamptz not null default now()
);

create index content_ideas_client_id_idx on content_ideas(client_id);
create index content_ideas_status_idx on content_ideas(status);

-- ─── footage_assets ──────────────────────────────────────────
create table footage_assets (
  id                uuid primary key default uuid_generate_v4(),
  content_idea_id   uuid not null references content_ideas(id) on delete cascade,
  drive_file_id     text not null,
  drive_file_name   text not null,
  synced_at         timestamptz not null default now()
);

create index footage_assets_idea_idx on footage_assets(content_idea_id);

-- ─── edits ───────────────────────────────────────────────────
create type edit_status as enum ('in_review', 'changes_requested', 'approved');

create table edits (
  id               uuid primary key default uuid_generate_v4(),
  content_idea_id  uuid not null references content_ideas(id) on delete cascade,
  video_url        text not null,
  version          integer not null default 1,
  status           edit_status not null default 'in_review',
  created_at       timestamptz not null default now()
);

create index edits_idea_idx on edits(content_idea_id);

-- ─── edit_comments ───────────────────────────────────────────
create table edit_comments (
  id               uuid primary key default uuid_generate_v4(),
  edit_id          uuid not null references edits(id) on delete cascade,
  author_id        uuid not null references auth.users(id) on delete cascade,
  timestamp_seconds integer not null default 0,
  body             text not null,
  created_at       timestamptz not null default now()
);

create index edit_comments_edit_idx on edit_comments(edit_id);

-- ─── channels ────────────────────────────────────────────────
create table channels (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  name        text not null,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now()
);

create index channels_client_idx on channels(client_id);

-- ─── messages ────────────────────────────────────────────────
create table messages (
  id                   uuid primary key default uuid_generate_v4(),
  channel_id           uuid not null references channels(id) on delete cascade,
  author_id            uuid not null references auth.users(id) on delete cascade,
  body                 text not null,
  reply_to_message_id  uuid references messages(id) on delete set null,
  edited_at            timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now()
);

create index messages_channel_idx on messages(channel_id, created_at);

-- ─── ad_metrics_daily ────────────────────────────────────────
create type ad_platform as enum ('meta', 'tiktok');

create table ad_metrics_daily (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references clients(id) on delete cascade,
  date         date not null,
  platform     ad_platform not null,
  spend        numeric(12,2) not null default 0,
  impressions  bigint not null default 0,
  clicks       bigint not null default 0,
  conversions  bigint not null default 0,
  roas         numeric(8,4) not null default 0,
  ctr          numeric(8,6) not null default 0,
  cpp          numeric(12,2) not null default 0,
  unique (client_id, date, platform)
);

create index ad_metrics_client_date_idx on ad_metrics_daily(client_id, date desc);

-- ─── social_metrics_daily ────────────────────────────────────
create table social_metrics_daily (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references clients(id) on delete cascade,
  date        date not null,
  platform    text not null,
  views       bigint not null default 0,
  followers   bigint not null default 0,
  unique (client_id, date, platform)
);

create index social_metrics_client_date_idx on social_metrics_daily(client_id, date desc);

-- ─── reports ─────────────────────────────────────────────────
create type period_type as enum ('week', 'month');

create table reports (
  id            uuid primary key default uuid_generate_v4(),
  client_id     uuid not null references clients(id) on delete cascade,
  period_type   period_type not null,
  period_start  date not null,
  period_end    date not null,
  notes         text,
  generated_at  timestamptz not null default now()
);

create index reports_client_idx on reports(client_id, period_start desc);

-- ============================================================
--  Row Level Security
-- ============================================================

-- Helper: is the current user an agency staff member?
create or replace function is_agency()
returns boolean
language sql stable security definer
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'agency',
    false
  )
$$;

-- Helper: get client_id for the authenticated user
create or replace function my_client_id()
returns uuid
language sql stable security definer
as $$
  select id from clients where user_id = auth.uid() limit 1
$$;

-- Enable RLS on all tables
alter table clients enable row level security;
alter table client_profiles enable row level security;
alter table content_ideas enable row level security;
alter table footage_assets enable row level security;
alter table edits enable row level security;
alter table edit_comments enable row level security;
alter table channels enable row level security;
alter table messages enable row level security;
alter table ad_metrics_daily enable row level security;
alter table social_metrics_daily enable row level security;
alter table reports enable row level security;

-- ── clients ──
create policy "clients: own row or agency"
  on clients for all
  using (user_id = auth.uid() or is_agency());

-- ── client_profiles ──
create policy "profiles: own client or agency"
  on client_profiles for all
  using (client_id = my_client_id() or is_agency());

-- ── content_ideas ──
create policy "ideas: own client or agency"
  on content_ideas for all
  using (client_id = my_client_id() or is_agency());

-- ── footage_assets ──
create policy "footage: via idea client or agency"
  on footage_assets for all
  using (
    content_idea_id in (
      select id from content_ideas where client_id = my_client_id()
    ) or is_agency()
  );

-- ── edits ──
create policy "edits: via idea client or agency"
  on edits for all
  using (
    content_idea_id in (
      select id from content_ideas where client_id = my_client_id()
    ) or is_agency()
  );

-- ── edit_comments ──
create policy "edit_comments: via edit → idea → client or agency"
  on edit_comments for all
  using (
    edit_id in (
      select e.id from edits e
      join content_ideas ci on ci.id = e.content_idea_id
      where ci.client_id = my_client_id()
    ) or is_agency()
  );

-- ── channels ──
create policy "channels: own client or agency"
  on channels for all
  using (client_id = my_client_id() or is_agency());

-- ── messages ──
create policy "messages: via channel client or agency"
  on messages for all
  using (
    channel_id in (
      select id from channels where client_id = my_client_id()
    ) or is_agency()
  );

-- ── ad_metrics_daily ──
create policy "ad_metrics: own client or agency"
  on ad_metrics_daily for all
  using (client_id = my_client_id() or is_agency());

-- ── social_metrics_daily ──
create policy "social_metrics: own client or agency"
  on social_metrics_daily for all
  using (client_id = my_client_id() or is_agency());

-- ── reports ──
create policy "reports: own client or agency"
  on reports for all
  using (client_id = my_client_id() or is_agency());

-- ============================================================
--  Default seed: provision 4 channels when a client is created
-- ============================================================
create or replace function seed_default_channels()
returns trigger
language plpgsql security definer
as $$
declare
  agency_uid uuid;
begin
  -- Use the client's own user_id as created_by if no agency user exists
  insert into channels (client_id, name, created_by) values
    (new.id, '#general',        new.user_id),
    (new.id, '#content-ideas',  new.user_id),
    (new.id, '#footage-drops',  new.user_id),
    (new.id, '#ads-updates',    new.user_id);
  return new;
end;
$$;

create trigger on_client_created
  after insert on clients
  for each row execute function seed_default_channels();

-- Also seed an empty client_profile row
create or replace function seed_client_profile()
returns trigger
language plpgsql security definer
as $$
begin
  insert into client_profiles (client_id) values (new.id)
    on conflict (client_id) do nothing;
  return new;
end;
$$;

create trigger on_client_created_profile
  after insert on clients
  for each row execute function seed_client_profile();
