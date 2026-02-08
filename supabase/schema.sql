create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen', 'staff', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles(id),
  title text not null,
  description text not null,
  category text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  priority int not null default 0,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists issue_media (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  type text not null check (type in ('before', 'after')),
  url text not null,
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  created_by uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles(id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists issues_updated_at on issues;
create trigger issues_updated_at
before update on issues
for each row
execute function set_updated_at();

alter table profiles enable row level security;
alter table issues enable row level security;
alter table issue_media enable row level security;
alter table comments enable row level security;
alter table updates enable row level security;

-- profiles policies
create policy "Profiles are viewable by owner"
on profiles for select
using (auth.uid() = id);

create policy "Profiles insert own"
on profiles for insert
with check (auth.uid() = id);

create policy "Profiles update own"
on profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- NOTE: Avoid "read all profiles" policy here to prevent recursion errors.

-- issues policies
create policy "Authenticated can read issues"
on issues for select
using (auth.role() = 'authenticated');

create policy "Citizens can create issues"
on issues for insert
with check (auth.uid() = created_by);

create policy "Creators can update their issues"
on issues for update
using (auth.uid() = created_by)
with check (auth.uid() = created_by);

create policy "Creators can delete their issues"
on issues for delete
using (auth.uid() = created_by);

create policy "Staff can update any issue"
on issues for update
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('staff', 'admin')
  )
)
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('staff', 'admin')
  )
);

create policy "Admin can delete any issue"
on issues for delete
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- issue_media policies
create policy "Authenticated can read issue media"
on issue_media for select
using (auth.role() = 'authenticated');

create policy "Creators can add before media"
on issue_media for insert
with check (
  type = 'before'
  and exists (
    select 1 from issues i
    where i.id = issue_id
      and i.created_by = auth.uid()
  )
);

create policy "Staff can add after media"
on issue_media for insert
with check (
  type = 'after'
  and exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('staff', 'admin')
  )
);

-- comments policies
create policy "Authenticated can read comments"
on comments for select
using (auth.role() = 'authenticated');

create policy "Authenticated can add comments"
on comments for insert
with check (auth.uid() = created_by);

-- updates policies
create policy "Authenticated can read updates"
on updates for select
using (auth.role() = 'authenticated');

create policy "Staff can create updates"
on updates for insert
with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('staff', 'admin')
  )
);

-- storage policies (issue-media bucket)
create policy "Authenticated can read issue media bucket"
on storage.objects for select
using (auth.role() = 'authenticated' and bucket_id = 'issue-media');

create policy "Authenticated can upload issue media"
on storage.objects for insert
with check (auth.role() = 'authenticated' and bucket_id = 'issue-media');
