# Supabase setup for Ankesi

One-time steps. About 20 minutes.

## 1. Create the project

1. https://supabase.com → New project. Region: Frankfurt (closest to Georgia).
2. Copy **Project URL** and **anon public key** from Settings → API.
3. In `web/.env.local`:
   ```
   VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon key>
   ```
   The app runs without these; sign-in and forms then show a "backend not
   configured" notice.

## 2. Schema

SQL editor → paste and run, in order:

1. `migrations/0001_init.sql`
2. `seed.sql` (regenerate with `node web/scripts/gen-seed.mjs` after editing spots)

Or, with the CLI: `supabase link --project-ref <ref>` then `supabase db push`
and `psql "$DATABASE_URL" -f supabase/seed.sql`.

## 3. Auth

Authentication → Providers:
- **Email**: on. Turn off "Confirm email" if you want magic links only.
  Keep "Enable email OTP / magic link".
- **Google**: on. Create OAuth credentials in Google Cloud Console, add the
  Supabase callback URL shown in the provider panel.

Authentication → URL Configuration:
- Site URL: your production origin (for now `http://localhost:5173`).
- Redirect URLs: `http://localhost:5173/**`, plus the production origin.

Email templates: the magic-link template can be bilingual; Georgian first.

## 4. Storage

`0001_init.sql` creates the public `photos` bucket with an 8 MB limit and
per-user folder policies. Nothing else to do.

## 5. Hourly weather history (optional in milestone 2, required for tuning)

1. Install the CLI, `supabase login`, `supabase link --project-ref <ref>`.
2. `supabase secrets set CRON_SECRET=<long random string>`
3. `supabase functions deploy snapshot`
4. Edit `cron.sql.example` with the project ref and the same secret, run it
   in the SQL editor. Check `select * from cron.job_run_details order by start_time desc limit 5;`
   after the next hour.

## 6. Moderation

Paid ponds submitted by owners land with `approved = false`. Review in
Table editor → `spots` filtered by `source = pond`, set `approved = true`.
Reports with three or more flags are hidden automatically.

## Data privacy notes

- Catches are private by default (`is_public = false`).
- Photos are in a public bucket: anyone with the URL can view. Tell users.
- Only `display_name` is exposed to other users, through `public_profiles`.
