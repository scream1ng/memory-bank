create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "owner_all" on projects
  for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create table memo_blocks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'text' check (type in ('text', 'photo')),
  content text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table memo_blocks enable row level security;

create policy "owner_all" on memo_blocks
  for all
  using (project_id in (select id from projects where owner_id = auth.uid()))
  with check (project_id in (select id from projects where owner_id = auth.uid()));
