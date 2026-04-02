-- ProAssistNG Admin schema (run in Supabase SQL editor)

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Admin allow-list (who can access admin tables)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.admin_users au where au.user_id = auth.uid()
  );
$$;

create policy "admin_users_select_own"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Never allow self-service admin assignment from the client.
drop policy if exists "admin_users_insert_own" on public.admin_users;

-- 3) Freelancers
create table if not exists public.freelancers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  title text,
  location text,
  experience text,
  status text not null default 'active',
  hourly_rate numeric,
  rate_type text not null default 'hourly' check (char_length(btrim(rate_type)) > 0),
  portfolio_url text,
  bio text,
  skills text[] not null default '{}',
  featured boolean not null default false,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Backwards-compatible (if the table already existed before this schema update)
alter table public.freelancers add column if not exists status text not null default 'active';
alter table public.freelancers add column if not exists created_at timestamptz not null default now();
alter table public.freelancers add column if not exists updated_at timestamptz not null default now();
alter table public.freelancers add column if not exists featured boolean not null default false;
alter table public.freelancers add column if not exists hourly_rate numeric;
alter table public.freelancers add column if not exists rate_type text not null default 'hourly';
alter table public.freelancers add column if not exists service_slugs text[] not null default '{}'::text[];
alter table public.freelancers add column if not exists phone_number text;

-- Normalize null/blank values before adding check constraints.
update public.freelancers
set rate_type = 'hourly'
where rate_type is null
  or btrim(rate_type) = '';

-- Remove old fixed-list constraint if present.
alter table public.freelancers
  drop constraint if exists freelancers_rate_type_check;

alter table public.freelancers
  drop constraint if exists freelancers_rate_type_allowed_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'freelancers_rate_type_allowed_check'
      and conrelid = 'public.freelancers'::regclass
  ) then
    alter table public.freelancers
      add constraint freelancers_rate_type_allowed_check
      check (char_length(btrim(rate_type)) > 0);
  end if;
end
$$;

alter table public.freelancers enable row level security;

create policy "freelancers_admin_all"
  on public.freelancers
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Allow anyone (including unauthenticated visitors) to read active freelancers.
-- This is required for the public-facing pages: browse-talents, service pages,
-- and the featured freelancers section on the homepage.
create policy "freelancers_public_read"
  on public.freelancers
  for select
  to anon, authenticated
  using (status = 'active');

-- 4) Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  sender_email text,
  user_ref text,
  subject text not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  starred boolean not null default false,
  unread boolean not null default true,
  status text not null default 'open',
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages_admin_all"
  on public.messages
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5) Subscribers (newsletter)
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now()
);

alter table public.subscribers enable row level security;

create policy "subscribers_public_insert"
  on public.subscribers for insert to anon, authenticated
  with check (true);

create policy "subscribers_admin_read"
  on public.subscribers for select to authenticated
  using (public.is_admin());

-- 6) Projects (for dashboard "Active Projects" stat)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_admin_all"
  on public.projects
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 6) Activity events (for dashboard activity feed)
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text,
  highlight boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;

create policy "activity_events_admin_all"
  on public.activity_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7) Grants (so PostgREST can see the tables for authenticated users)
-- RLS still controls row access (admin-only via public.is_admin()).
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
grant usage, select on sequences to authenticated;

-- Notes:
-- - Create initial admins manually in SQL as needed:
--   insert into public.admin_users (user_id, role) values ('<auth-user-uuid>', 'admin');

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 7) Storage bucket for freelancer profile photos
insert into storage.buckets (id, name, public)
values ('freelancer-photos', 'freelancer-photos', true)
on conflict (id) do nothing;

-- Allow anyone to read photos (public bucket)
create policy "freelancer_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'freelancer-photos');

-- Only admins can upload photos
create policy "freelancer_photos_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'freelancer-photos'
    and exists (
      select 1 from public.admin_users au where au.user_id = auth.uid()
    )
  );

-- Only admins can delete photos
create policy "freelancer_photos_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'freelancer-photos'
    and exists (
      select 1 from public.admin_users au where au.user_id = auth.uid()
    )
  );
