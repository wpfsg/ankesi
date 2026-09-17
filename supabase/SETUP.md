# Supabase setup for Ankesi

The backend is a Supabase project: Postgres with row-level security, auth
(magic link + code, Google), storage for photos, one edge function for the
hourly weather history. Everything about it lives in this folder and deploys
from the command line; the dashboard is only needed to create the project and
to moderate.

About 20 minutes the first time. You need Node 22+ (the CLI runs through
`npx`) and a free Supabase account. Docker is not required unless you want
`supabase start` for a full local stack.

## 1. Create the project

1. https://supabase.com/dashboard → **New project**. Region **Frankfurt**
   (closest to Georgia). Save the database password: the CLI asks for it.
2. Note the **project ref** (the `xxxx` in `https://xxxx.supabase.co`).

## 2. Deploy the backend

From the repository root:

```sh
npx supabase login                          # opens the browser once
npx supabase link --project-ref <ref>       # asks for the database password
npx supabase db push --include-seed         # migrations + the 108 seeded spots
npx supabase config push                    # auth URLs and settings, function settings
npx supabase functions deploy snapshot      # hourly weather history
npx supabase secrets set CRON_SECRET=$(openssl rand -hex 24)
```

Then schedule the snapshot: Dashboard → Database → Extensions → enable
`pg_cron` and `pg_net`; open `cron.sql.example`, fill in the project ref and
the same `CRON_SECRET`, run it in the SQL editor. Check the first run an hour
later with `select * from cron.job_run_details order by start_time desc limit 5;`.

If `config push` rejects a setting your plan does not have, set that one in
the dashboard and continue; nothing else depends on it.

## 3. Connect the app

Dashboard → Settings → API: copy **Project URL** and the **anon public** key.

- Locally: `web/.env.local`
  ```
  VITE_SUPABASE_URL=https://<ref>.supabase.co
  VITE_SUPABASE_ANON_KEY=<anon key>
  ```
- GitHub Pages: repository → Settings → Secrets → Actions: add
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The Pages workflow already
  reads them; the next push to `main` deploys with accounts on.

The anon key is public by design; every table is protected by row-level
security (see the scenarios in `tests/scenarios.mjs`).

## 4. Auth

**Email (magic link).** On by default with Supabase's stock English email.
Our own template, `templates/magic_link.html` (Georgian first, then English,
with the link *and* a 6-digit code because some mail apps pre-open or mangle
links), cannot be pushed on the free tier while the default mailer is in
use: the platform rejects it. It switches on together with SMTP, below.

**Sending email — do this before real users.** Supabase's built-in mail
service is for development only: a handful of emails per hour, and it may
only deliver to your own team's addresses. Point auth at your own SMTP
(Resend, Brevo, Postmark all have free tiers) in `config.toml`:

```toml
[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "resend"
pass = "env(SUPABASE_AUTH_SMTP_PASS)"
admin_email = "hello@your-domain.ge"
sender_name = "ანკესი"
```

then uncomment the three `[auth.email.template.magic_link]` lines, run
`SUPABASE_AUTH_SMTP_PASS=… npx supabase config push`, and set
`VITE_AUTH_EMAIL_CODE=1` in the app's environment so the sign-in sheet offers
the code field. You can also raise `[auth.rate_limit] email_sent` afterwards.

**Google.** Google Cloud Console → APIs & Services → Credentials → OAuth
client, type *Web application*, authorized redirect URI
`https://<ref>.supabase.co/auth/v1/callback`. Then in `config.toml` set
`[auth.external.google] enabled = true`, export
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `…_SECRET`, and `config push`.

**Redirect URLs.** `site_url` and `additional_redirect_urls` in `config.toml`
list the GitHub Pages origin and localhost. On a custom domain, replace them
and `config push`.

## 5. Continuous deployment (optional)

`.github/workflows/supabase.yml` runs the schema tests (section 6) on every
push or pull request that touches `supabase/`. On `main` it then re-runs the
steps of section 2, but only once the repository has these secrets; without
them the deploy job skips itself and you push by hand:

| Secret | Where |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_ID` | the project ref |
| `SUPABASE_DB_PASSWORD` | from step 1 |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `…_SECRET` | once Google is on |

## 6. Day-to-day

**Testing the schema without Docker.** `tests/` starts an embedded Postgres,
stands in for Supabase's `auth`/`storage` schemas and roles, applies the
migrations and the seed, then runs ~65 row-level-security scenarios (a user
cannot approve their own pond, a third flag hides a report, private catches
stay private, …):

```sh
npm --prefix supabase/tests install
npm --prefix supabase/tests test
```

**Changing the schema.** `0001_init.sql` is frozen once it has been applied
anywhere. Add a file with `npx supabase migration new <name>`, write the
change, add a scenario, run the tests, `db push`.

**Changing spots.** Edit `web/src/data/spots.ts`, then `cd web && npm run
seed` regenerates `seed.sql`; `db push --include-seed` upserts by id.

**Moderation.**
- Paid ponds land with `approved = false`. Table editor → `spots`, filter
  `source = pond`, set `approved` to true. Owners see the state in their
  profile and can withdraw a pending one; approved ponds are yours to edit.
- Reports with three flags hide themselves (`hidden = true`).
- The Premium launch list is `waitlist`; it is insert-only through the API,
  read it in the table editor.

## Data privacy notes

- Catches are private by default (`is_public = false`).
- Photos are in a public bucket: anyone with the URL can view. The form says so.
- Only `display_name` reaches other users, through `public_profiles`; the
  user sets it in the profile.
- `waitlist` emails are never readable through the API.
