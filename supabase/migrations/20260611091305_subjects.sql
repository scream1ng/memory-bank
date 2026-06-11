create table subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now() not null
);

alter table subjects enable row level security;

create policy "owner_all" on subjects for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

alter table projects add column subject_id uuid references subjects(id) on delete set null;
