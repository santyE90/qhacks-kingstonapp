# CityFix (Hackathon MVP)

Mobile-first PWA-style app to report city issues, get quick staff responses, and show before/after resolution photos.

## Tech stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth, Postgres, Storage)

## Setup
1. Install dependencies
```bash
npm install
```

2. Create a Supabase project
- Go to Supabase, create a new project.
- In the SQL editor, run `supabase/schema.sql`.

3. Create Storage bucket
- Create a bucket named `issue-media`.
- For hackathon speed, set it to **public**.
- Keep RLS policies from `supabase/schema.sql` enabled.

4. Configure environment variables
- Copy `.env.example` to `.env.local` and fill values.

5. Run locally
```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Promote a user to staff or admin
Run this one-liner in the Supabase SQL editor:
```sql
update profiles
set role = 'staff'
where id = (select id from auth.users where email = 'you@example.com');
```

To make an admin:
```sql
update profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

## Notes
- Email confirmation is easiest disabled during hackathon.
- Citizens can create issues and comment.
- Staff can update status and upload “after” photos to resolve issues.

## Supabase schema
See `supabase/schema.sql` for tables and RLS policies.

## Map feature (optional coordinates)
The map shows pins for issues that have coordinates. During issue creation, users can optionally add latitude/longitude.
