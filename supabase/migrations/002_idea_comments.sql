-- ============================================================
--  Pulse Media — Idea Comments
--  Threaded client feedback on individual content ideas.
-- ============================================================

create table idea_comments (
  id          uuid primary key default uuid_generate_v4(),
  idea_id     uuid not null references content_ideas(id) on delete cascade,
  author_id   uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  edited_at   timestamptz
);

create index idea_comments_idea_id_idx on idea_comments(idea_id);

-- RLS: clients can read/write only their own idea's comments
alter table idea_comments enable row level security;

create policy "Clients can read comments on their ideas"
  on idea_comments for select
  using (
    exists (
      select 1 from content_ideas ci
      join clients c on c.id = ci.client_id
      where ci.id = idea_comments.idea_id
        and c.user_id = auth.uid()
    )
  );

create policy "Clients can insert comments on their ideas"
  on idea_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from content_ideas ci
      join clients c on c.id = ci.client_id
      where ci.id = idea_id
        and c.user_id = auth.uid()
    )
  );

create policy "Authors can update their own comments"
  on idea_comments for update
  using (author_id = auth.uid());

create policy "Authors can delete their own comments"
  on idea_comments for delete
  using (author_id = auth.uid());
