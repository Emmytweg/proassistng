# Auto-Deletion with PostgreSQL pg_cron

## Overview

The deletion system is now fully integrated into your Supabase SQL schema. It uses PostgreSQL's `pg_cron` extension to automatically delete completed workspaces 48 hours after they're marked as complete.

## How It Works

1. **User marks workspace as "Completed"**
   - Frontend sets status to "completed"
   - `scheduled_deletion_at` is set to `now() + 48 hours`

2. **Cron Job Runs Every 6 Hours**
   - Checks for workspaces where `scheduled_deletion_at <= now()`
   - Deletes them in batches (max 100 per run)
   - Records deletion in audit table

3. **Cascade Delete**
   - Database automatically deletes:
     - All project messages
     - All project files (DB records)
     - All project activity
     - All project calls
     - All project notifications
   - Storage files are kept but orphaned (optional cleanup below)

## Setup Steps

### Step 1: Run the SQL Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire content of `supabase/project-workspace.sql`
5. Paste it into the editor
6. Click **Run**

The script will:

- Enable `pg_cron` extension
- Create the `workspace_deletions` audit table
- Schedule the deletion job

### Step 2: Verify the Job Was Created

Run this query in Supabase SQL Editor:

```sql
select * from cron.job;
```

You should see:

- `jobid`: A numeric ID
- `schedule`: `0 */6 * * *` (every 6 hours)
- `command`: The deletion function
- `nodename`: Your database node

### Step 3: Monitor Deletions

View all deleted workspaces:

```sql
select * from public.workspace_deletions order by deleted_at desc;
```

View deletion stats:

```sql
select
  date_trunc('day', deleted_at) as day,
  count(*) as deleted_count
from public.workspace_deletions
group by date_trunc('day', deleted_at)
order by day desc;
```

## Cron Schedule Reference

The job runs on this schedule: `0 */6 * * *`

Breakdown:

- `0` = At minute 0
- `*/6` = Every 6 hours (0, 6, 12, 18)
- `*` = Every day of month
- `*` = Every month
- `*` = Every day of week

**Common alternatives:**

- `0 0 * * *` - Daily at midnight UTC
- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes

## Change the Schedule

If you want to change the deletion interval (e.g., every 12 hours instead of 6):

```sql
-- Unschedule the current job
select cron.unschedule('delete-expired-workspaces');

-- Reschedule with new interval (every 12 hours)
select cron.schedule(
  'delete-expired-workspaces',
  '0 */12 * * *',
  $$
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
  $$
);
```

## Disable Auto-Deletion

If you need to temporarily disable deletions:

```sql
select cron.unschedule('delete-expired-workspaces');
```

Re-enable:

```sql
select cron.schedule(
  'delete-expired-workspaces',
  '0 */6 * * *',
  $$ ... $$  -- Same query as above
);
```

## Storage Cleanup (Optional)

The above SQL only deletes database records. To also clean up orphaned storage files:

```sql
-- Find orphaned files (in storage but not in DB)
select name
from storage.objects
where bucket_id = 'project-files'
  and name not in (
    select storage_path from public.project_files
  );

-- Delete them
delete from storage.objects
where bucket_id = 'project-files'
  and name not in (
    select storage_path from public.project_files
  );
```

## Troubleshooting

### Job not running?

Check if pg_cron is enabled:

```sql
select * from pg_extension where extname = 'pg_cron';
```

### Permission denied errors?

Ensure postgres role has permissions:

```sql
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
```

### View job logs/errors:

```sql
select * from cron.job_run_details
order by start_time desc
limit 10;
```

## Important Notes

⚠️ **48-Hour Window**: Workspaces are deleted automatically 48 hours after being marked "Completed". Users should download their files before this window closes.

✅ **Cascade Delete**: All related records are automatically deleted via foreign key constraints.

✅ **Audit Trail**: All deletions are logged in `workspace_deletions` table for compliance/auditing.

✅ **No External Dependencies**: Runs entirely in PostgreSQL, no external services needed.

## Summary

Your auto-deletion system is ready! Just run the SQL migration and it will:

- ✅ Run every 6 hours automatically
- ✅ Delete workspaces 48 hours after completion
- ✅ Log all deletions for auditing
- ✅ Require zero maintenance
