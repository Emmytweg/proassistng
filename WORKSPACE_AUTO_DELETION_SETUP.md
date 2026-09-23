# Auto-Deletion Setup Guide

## Step 1: Deploy the Edge Function

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Navigate to your project
cd c:\Users\TWEG\proassistng

# Login to Supabase
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy delete-completed-workspaces
```

## Step 2: Schedule the Function (Choose One Option)

### Option A: **Vercel Crons** (Easiest - Free)

1. Add to your `package.json`:

```json
{
  "scripts": {
    "cron:delete-workspaces": "node scripts/delete-workspaces.js"
  }
}
```

2. Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/crons/delete-workspaces",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

3. Create `app/api/crons/delete-workspaces/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify this is a Vercel cron request
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/delete-completed-workspaces`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error deleting workspaces:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
```

### Option B: **pg_cron** (Database-Level - Advanced)

Run this in Supabase SQL Editor:

```sql
-- Enable pg_cron extension
create extension if not exists pg_cron with schema extensions;

-- Grant permissions
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Create the scheduled job (runs every 6 hours)
select cron.schedule(
  'delete-completed-workspaces',
  '0 */6 * * *',  -- Every 6 hours
  $$
    with deleted_workspaces as (
      delete from public.project_workspaces
      where status = 'completed'
        and scheduled_deletion_at is not null
        and scheduled_deletion_at <= now()
      returning id
    )
    select count(*) as deleted from deleted_workspaces;
  $$
);

-- View scheduled jobs
select * from cron.job;

-- Delete a job if needed
-- select cron.unschedule('delete-completed-workspaces');
```

### Option C: **External Service** (AWS Lambda, Render, Railway, etc)

Create a cron job on your hosting platform that calls your Edge Function:

```typescript
// Example: AWS Lambda or similar
import fetch from "node-fetch";

export async function handler() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const response = await fetch(
    `${supabaseUrl}/functions/v1/delete-completed-workspaces`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    },
  );

  return {
    statusCode: response.status,
    body: JSON.stringify(await response.json()),
  };
}
```

## Step 3: Test Locally

```bash
# Test the Edge Function locally
supabase functions serve

# In another terminal
curl -X POST http://localhost:54321/functions/v1/delete-completed-workspaces \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json"
```

## Cron Schedule Formats

The cron expression format is: `minute hour day month day-of-week`

Common patterns:

- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Every day at midnight
- `0 */12 * * *` - Every 12 hours
- `0 * * * *` - Every hour
- `*/30 * * * *` - Every 30 minutes

## Environment Variables Needed

For Vercel Crons, add to `.env.local`:

```
CRON_SECRET=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Monitoring

Add logging to track deletions:

```sql
-- Optional: Create an audit table
create table if not exists public.workspace_deletions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  deleted_at timestamptz default now(),
  reason text
);

-- Then in the deletion function, insert a record:
insert into public.workspace_deletions (workspace_id, reason)
values (workspace.id, 'Scheduled auto-deletion after 48 hours');
```

## Recommended Setup

1. **Development**: Use Option A (Vercel Crons) - Simple, free, integrated
2. **Production**: Use Option A or B
   - Option A if deployed on Vercel
   - Option B if you want everything in Supabase

Start with **Vercel Crons** - it's the easiest to implement and requires no additional services!
