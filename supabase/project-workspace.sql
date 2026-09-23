-- ProAssistNG project workspace schema
-- Run in Supabase SQL editor once.

create extension if not exists pgcrypto;

create table if not exists public.project_workspaces (
  id uuid primary key default gen_random_uuid(),
  tx_ref text,
  payment_id text,
  freelancer_id text not null,
  freelancer_name text not null default 'Freelancer',
  freelancer_email text,
  client_id uuid,
  client_name text,
  client_email text not null,
  title text not null,
  description text,
  requirements text,
  status text not null default 'pending' check (status in (
    'pending',
    'active',
    'awaiting_client',
    'revision_requested',
    'submitted',
    'completed',
    'cancelled'
  )),
  amount numeric(12,2) default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deadline timestamptz,
  unique (tx_ref)
);

create index if not exists project_workspaces_client_email_idx
  on public.project_workspaces (client_email);

create index if not exists project_workspaces_freelancer_idx
  on public.project_workspaces (freelancer_id);

alter table public.project_workspaces
  add column if not exists freelancer_email text;

alter table public.project_workspaces
  add column if not exists scheduled_deletion_at timestamptz;

update public.project_workspaces pw
set freelancer_email = lower(nullif(btrim(f.email), ''))
from public.freelancers f
where pw.freelancer_id = f.id::text
  and nullif(btrim(f.email), '') is not null
  and (pw.freelancer_email is null or pw.freelancer_email = '');

create index if not exists project_workspaces_status_idx
  on public.project_workspaces (status);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces(id) on delete cascade,
  sender_id uuid,
  sender_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  edited_at timestamptz,
  status text not null default 'sent'
);

create index if not exists project_messages_project_created_idx
  on public.project_messages (project_id, created_at desc);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces(id) on delete cascade,
  uploaded_by uuid,
  file_name text not null,
  file_size bigint not null default 0,
  file_type text,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists project_files_project_idx
  on public.project_files (project_id, created_at desc);

create table if not exists public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces(id) on delete cascade,
  user_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_activity_project_created_idx
  on public.project_activity (project_id, created_at desc);

create table if not exists public.project_calls (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces(id) on delete cascade,
  caller_id uuid,
  receiver_id uuid,
  status text not null default 'initiated' check (status in (
    'initiated', 'ringing', 'accepted', 'declined', 'missed', 'cancelled', 'ended', 'failed'
  )),
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Keep existing installations in sync when the call metadata field is added later.
alter table public.project_calls
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Include the complete updated row in realtime events for call signaling.
alter table public.project_calls replica identity full;

create index if not exists project_calls_project_created_idx
  on public.project_calls (project_id, created_at desc);

create table if not exists public.project_notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project_workspaces(id) on delete cascade,
  user_id uuid,
  type text not null default 'project_updated',
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_notifications_project_idx
  on public.project_notifications (project_id, created_at desc);

-- Enable Postgres Changes for live workspace updates on existing installations.
do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array[
      'project_messages',
      'project_files',
      'project_activity',
      'project_notifications',
      'project_calls'
    ] loop
      begin
        execute format(
          'alter publication supabase_realtime add table public.%I',
          table_name
        );
      exception
        when duplicate_object then null;
      end;
    end loop;
  end if;
end
$$;

alter table public.project_workspaces enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_files enable row level security;
alter table public.project_activity enable row level security;
alter table public.project_calls enable row level security;
alter table public.project_notifications enable row level security;

create or replace function public.project_member_matches(project_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_workspaces p
    where p.id = project_id
      and (
        (p.client_email = lower(auth.jwt() ->> 'email')
         or p.freelancer_email = lower(auth.jwt() ->> 'email'))
        or p.freelancer_email = lower(auth.jwt() ->> 'email')
        or p.freelancer_id = auth.uid()::text
      )
  );
$$;

-- Project workspace access is limited to the project client or freelancer.
drop policy if exists "project_workspaces_select_member" on public.project_workspaces;
drop policy if exists "project_workspaces_insert_only_authenticated" on public.project_workspaces;
drop policy if exists "project_workspaces_update_member" on public.project_workspaces;
drop policy if exists "project_messages_select_member" on public.project_messages;
drop policy if exists "project_messages_insert_member" on public.project_messages;
drop policy if exists "project_activity_select_member" on public.project_activity;
drop policy if exists "project_activity_insert_member" on public.project_activity;
drop policy if exists "project_files_select_member" on public.project_files;
drop policy if exists "project_files_insert_member" on public.project_files;
drop policy if exists "project_calls_select_member" on public.project_calls;
drop policy if exists "project_calls_insert_member" on public.project_calls;
drop policy if exists "project_calls_update_member" on public.project_calls;
drop policy if exists "project_notifications_select_member" on public.project_notifications;
drop policy if exists "project_notifications_insert_member" on public.project_notifications;
drop policy if exists "project_workspaces_update_admin" on public.project_workspaces;

create policy "project_workspaces_select_member"
  on public.project_workspaces
  for select
  to authenticated
  using (
    client_email = lower(auth.jwt() ->> 'email')
    or freelancer_email = lower(auth.jwt() ->> 'email')
    or freelancer_id = auth.uid()::text
  );

create policy "project_workspaces_insert_only_authenticated"
  on public.project_workspaces
  for insert
  to authenticated
  with check (true);

create policy "project_workspaces_update_member"
  on public.project_workspaces
  for update
  to authenticated
  using (
    client_email = lower(auth.jwt() ->> 'email')
    or freelancer_email = lower(auth.jwt() ->> 'email')
    or freelancer_id = auth.uid()::text
  )
  with check (
    client_email = lower(auth.jwt() ->> 'email')
    or freelancer_email = lower(auth.jwt() ->> 'email')
    or freelancer_id = auth.uid()::text
  );

create policy "project_workspaces_update_admin"
  on public.project_workspaces
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "project_messages_select_member"
  on public.project_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_messages.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_messages_insert_member"
  on public.project_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_messages.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_activity_select_member"
  on public.project_activity
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_activity.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_activity_insert_member"
  on public.project_activity
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_activity.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_files_select_member"
  on public.project_files
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_files.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_files_insert_member"
  on public.project_files
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_files.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_calls_select_member"
  on public.project_calls
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_calls.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_calls_insert_member"
  on public.project_calls
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_calls.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_calls_update_member"
  on public.project_calls
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_calls.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  )
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_calls.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_notifications_select_member"
  on public.project_notifications
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_notifications.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_notifications_insert_member"
  on public.project_notifications
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.project_workspaces p
      where p.id = project_notifications.project_id
        and (
          (p.client_email = lower(auth.jwt() ->> 'email')
           or p.freelancer_email = lower(auth.jwt() ->> 'email'))
          or p.freelancer_id = auth.uid()::text
        )
    )
  );

-- Optional storage bucket for project files.
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

drop policy if exists "project_files_bucket_select_member" on storage.objects;
drop policy if exists "project_files_bucket_insert_member" on storage.objects;
drop policy if exists "project_files_bucket_delete_member" on storage.objects;

create policy "project_files_bucket_select_member"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and exists (
      select 1
      from public.project_files pf
      join public.project_workspaces pw on pw.id = pf.project_id
      where pf.storage_path = storage.objects.name
        and (
          (pw.client_email = lower(auth.jwt() ->> 'email')
           or pw.freelancer_email = lower(auth.jwt() ->> 'email'))
          or pw.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_files_bucket_insert_member"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and exists (
      select 1
      from public.project_workspaces pw
      where split_part(storage.objects.name, '/', 1) = pw.id::text
        and (
          (pw.client_email = lower(auth.jwt() ->> 'email')
           or pw.freelancer_email = lower(auth.jwt() ->> 'email'))
          or pw.freelancer_id = auth.uid()::text
        )
    )
  );

create policy "project_files_bucket_delete_member"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and exists (
      select 1
      from public.project_files pf
      join public.project_workspaces pw on pw.id = pf.project_id
      where pf.storage_path = storage.objects.name
        and (
          (pw.client_email = lower(auth.jwt() ->> 'email')
           or pw.freelancer_email = lower(auth.jwt() ->> 'email'))
          or pw.freelancer_id = auth.uid()::text
        )
    )
  );

-- =============================================================================
-- AUTO-DELETION SYSTEM (PostgreSQL pg_cron)
-- =============================================================================

-- Optional: Create audit table for tracking deletions
create table if not exists public.workspace_deletions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  workspace_title text,
  deleted_at timestamptz default now(),
  reason text
);

create index if not exists workspace_deletions_deleted_at_idx
  on public.workspace_deletions (deleted_at desc);

-- Schedule the cleanup only when pg_cron is enabled by the Supabase project.
-- This avoids changing Supabase-managed cron privileges during schema reruns.
do $$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    if exists (
      select 1
      from cron.job
      where jobname = 'delete-expired-workspaces'
    ) then
      perform cron.unschedule('delete-expired-workspaces');
    end if;

    perform cron.schedule(
      'delete-expired-workspaces',
      '0 */6 * * *',
      $cleanup$
        with workspaces_to_delete as (
          select id, title
          from public.project_workspaces
          where status = 'completed'
            and scheduled_deletion_at is not null
            and scheduled_deletion_at <= now()
          limit 100
        ),
        deleted_workspaces as (
          delete from public.project_workspaces
          where id in (select id from workspaces_to_delete)
          returning id, title
        )
        insert into public.workspace_deletions (workspace_id, workspace_title, reason)
        select id, title, 'Scheduled auto-deletion after 48 hours of completion'
        from deleted_workspaces;
      $cleanup$
    );
  end if;
end
$$;

-- View all scheduled jobs
-- select * from cron.job;

-- Unschedule the job if needed (uncomment to disable)
-- select cron.unschedule('delete-expired-workspaces');
