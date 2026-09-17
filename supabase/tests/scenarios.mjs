// Row-level-security scenarios, run by run.mjs after the migrations and the
// seed. Each runs in its own transaction as the given role/user and
// is committed on success so later scenarios build on earlier ones.
const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
const D = '44444444-4444-4444-8444-444444444444'
const as = (sub) => ({ role: 'authenticated', sub })
const anon = { role: 'anon' }

export const tests = [
  { name: 'seed loaded 108 spots', sql: `select count(*)::int as n from public.spots`, check: (r) => r[0].n === 108 },
  {
    name: 'signup trigger creates profiles (name from Google metadata, else email local part)',
    sql: `insert into auth.users (id, email, raw_user_meta_data) values
            ('${A}', 'gio@example.com', '{"full_name":"Gio Beridze"}'),
            ('${B}', 'nino@example.com', '{}'), ('${C}', 'c@example.com', '{}'), ('${D}', 'd@example.com', '{}');
          select id, display_name from public.profiles order by id`,
    check: (r) => r.length === 4 && r[0].display_name === 'Gio Beridze' && r[1].display_name === 'nino',
  },

  // spots
  { name: 'anon reads all approved spots', ...anon, sql: `select id from public.spots`, rows: 108 },
  { name: 'anon cannot insert a report', ...anon, sql: `insert into public.reports (spot_id, activity) values ('lisi', 1)`, expect: 'error', code: '42501' },

  // profiles
  { name: 'user reads only own profile', ...as(A), sql: `select id from public.profiles`, rows: 1 },
  { name: 'user updates own display name', ...as(A), sql: `update public.profiles set display_name = 'გიო' where id = '${A}' returning display_name`, check: (r) => r[0].display_name === 'გიო' },
  { name: 'user cannot update another profile', ...as(A), sql: `update public.profiles set display_name = 'x' where id = '${B}' returning id`, rows: 0 },
  { name: 'user cannot insert a profile for someone else', ...as(A), sql: `insert into public.profiles (id, display_name) values ('${B}', 'x')`, expect: 'error', code: '42501' },
  { name: 'user can upsert own profile (client fallback if the trigger never ran)', ...as(A), sql: `insert into public.profiles (id, display_name) values ('${A}', 'Gio') on conflict (id) do update set display_name = excluded.display_name returning display_name`, check: (r) => r[0].display_name === 'Gio' },
  { name: 'display name is capped at 40 chars', ...as(A), sql: `update public.profiles set display_name = repeat('x', 41) where id = '${A}'`, expect: 'error', code: '23514' },
  { name: 'public_profiles exposes names to anon', ...anon, sql: `select display_name from public.public_profiles where id = '${A}'`, check: (r) => r[0]?.display_name === 'Gio' },

  // reports + flags
  { name: 'user posts a report', ...as(A), sql: `insert into public.reports (spot_id, activity, note) values ('lisi', 2, 'carp everywhere') returning id`, rows: 1, after: (r, ctx) => (ctx.report = r[0].id) },
  { name: 'second report on the same spot within 30 min is rejected', ...as(A), sql: `insert into public.reports (spot_id, activity) values ('lisi', 1)`, expect: 'error' },
  { name: 'report on another spot right away is fine', ...as(A), sql: `insert into public.reports (spot_id, activity) values ('kumisi', 0) returning id`, rows: 1 },
  { name: 'user cannot post a report as someone else', ...as(A), sql: `insert into public.reports (user_id, spot_id, activity) values ('${B}', 'kumisi', 1)`, expect: 'error', code: '42501' },
  { name: 'anon sees both reports', ...anon, sql: `select id from public.reports`, rows: 2 },
  { name: 'B flags the report', ...as(B), sql: (c) => `insert into public.report_flags (report_id) values ('${c.report}')`, },
  { name: 'B cannot flag twice', ...as(B), sql: (c) => `insert into public.report_flags (report_id) values ('${c.report}')`, expect: 'error', code: '23505' },
  { name: 'C flags', ...as(C), sql: (c) => `insert into public.report_flags (report_id) values ('${c.report}')` },
  { name: 'still visible with two flags', ...anon, sql: (c) => `select id from public.reports where id = '${c.report}'`, rows: 1 },
  { name: 'D flags: third flag hides it', ...as(D), sql: (c) => `insert into public.report_flags (report_id) values ('${c.report}')` },
  { name: 'hidden report is gone for anon', ...anon, sql: (c) => `select id from public.reports where id = '${c.report}'`, rows: 0 },
  { name: 'author still sees own hidden report', ...as(A), sql: (c) => `select id, hidden from public.reports where id = '${c.report}'`, check: (r) => r.length === 1 && r[0].hidden === true },
  { name: 'user cannot read other people\'s flags', ...as(A), sql: `select * from public.report_flags`, rows: 0 },
  { name: 'user can delete own report', ...as(A), sql: `delete from public.reports where spot_id = 'kumisi' returning id`, rows: 1 },

  // catches
  { name: 'user logs a private catch', ...as(A), sql: `insert into public.catches (spot_id, species_id, weight_kg, weather_snapshot) values ('lisi', 'carp', 3.2, '{"model":"v0.2","score":71}') returning id`, rows: 1, after: (r, ctx) => (ctx.catch = r[0].id) },
  { name: 'weight above 500 kg is rejected', ...as(A), sql: `insert into public.catches (spot_id, species_id, weight_kg) values ('lisi', 'carp', 600)`, expect: 'error', code: '23514' },
  { name: 'anon does not see private catches', ...anon, sql: `select id from public.catches`, rows: 0 },
  { name: 'other user does not see private catches', ...as(B), sql: `select id from public.catches`, rows: 0 },
  { name: 'owner sees own catch', ...as(A), sql: `select id from public.catches`, rows: 1 },
  { name: 'owner makes it public', ...as(A), sql: (c) => `update public.catches set is_public = true where id = '${c.catch}' returning id`, rows: 1 },
  { name: 'public catch is visible to others', ...as(B), sql: `select id from public.catches`, rows: 1 },
  { name: 'other user cannot delete it', ...as(B), sql: (c) => `delete from public.catches where id = '${c.catch}' returning id`, rows: 0 },
  { name: 'owner deletes it', ...as(A), sql: (c) => `delete from public.catches where id = '${c.catch}' returning id`, rows: 1 },

  // saved spots
  { name: 'user saves a spot', ...as(A), sql: `insert into public.saved_spots (spot_id) values ('lisi') returning spot_id`, rows: 1 },
  { name: 'saving again is an idempotent upsert', ...as(A), sql: `insert into public.saved_spots (spot_id, user_id) values ('lisi', '${A}') on conflict (user_id, spot_id) do update set alerts = excluded.alerts returning spot_id`, rows: 1 },
  { name: 'other user sees no saved spots', ...as(B), sql: `select spot_id from public.saved_spots`, rows: 0 },
  { name: 'user cannot save on behalf of another', ...as(A), sql: `insert into public.saved_spots (spot_id, user_id) values ('kumisi', '${B}')`, expect: 'error', code: '42501' },

  // paid ponds
  {
    name: 'owner submits a pond (unapproved)',
    ...as(A),
    sql: `insert into public.spots (id, name_ka, name_en, type, region, lat, lon, depth, species, source, owner_id, approved, fee_gel)
          values ('pond-test-1', 'ტესტი', 'Test pond', 'paid', 'tbilisi', 41.7, 44.8, 'shallow', '{"carp":1}', 'pond', '${A}', false, 30) returning id`,
    rows: 1,
  },
  { name: 'owner cannot submit a pre-approved pond', ...as(A), sql: `insert into public.spots (id, name_ka, name_en, type, region, lat, lon, depth, source, owner_id, approved) values ('pond-test-2', 'x', 'x', 'paid', 'tbilisi', 41.7, 44.8, 'shallow', 'pond', '${A}', true)`, expect: 'error', code: '42501' },
  { name: 'owner cannot submit a seed-source spot', ...as(A), sql: `insert into public.spots (id, name_ka, name_en, type, region, lat, lon, depth, source, owner_id, approved) values ('fake-seed', 'x', 'x', 'lake', 'tbilisi', 41.7, 44.8, 'shallow', 'seed', '${A}', false)`, expect: 'error', code: '42501' },
  { name: 'unapproved pond is invisible to anon', ...anon, sql: `select id from public.spots where id = 'pond-test-1'`, rows: 0 },
  { name: 'owner sees own unapproved pond', ...as(A), sql: `select id, approved from public.spots where id = 'pond-test-1'`, rows: 1 },
  { name: 'owner edits pond details', ...as(A), sql: `update public.spots set fee_gel = 35, hours = '06:00-20:00' where id = 'pond-test-1' returning fee_gel`, check: (r) => Number(r[0].fee_gel) === 35 },
  { name: 'owner CANNOT approve own pond', ...as(A), sql: `update public.spots set approved = true where id = 'pond-test-1' returning approved`, expect: 'error', code: '42501' },
  { name: 'owner cannot hand the pond to someone else', ...as(A), sql: `update public.spots set owner_id = '${B}' where id = 'pond-test-1'`, expect: 'error', code: '42501' },
  { name: 'other user cannot edit the pond', ...as(B), sql: `update public.spots set fee_gel = 1 where id = 'pond-test-1' returning id`, rows: 0 },
  { name: 'user cannot edit a seed spot', ...as(A), sql: `update public.spots set name_en = 'hacked' where id = 'lisi' returning id`, rows: 0 },
  { name: 'moderator approval (service role) makes it public', role: 'service_role', sql: `update public.spots set approved = true where id = 'pond-test-1'; select id from public.spots where id = 'pond-test-1' and approved`, rows: 1 },
  { name: 'approved pond visible to anon', ...anon, sql: `select id from public.spots where id = 'pond-test-1'`, rows: 1 },
  { name: 'owner can still edit after approval', ...as(A), sql: `update public.spots set contact = '+995 555 000000' where id = 'pond-test-1' returning id`, rows: 1 },

  // weather history
  { name: 'anon can read weather history', ...anon, sql: `select * from public.weather_hourly`, rows: 0 },
  { name: 'users cannot write weather history', ...as(A), sql: `insert into public.weather_hourly (spot_id, ts, temp) values ('lisi', now(), 20)`, expect: 'error', code: '42501' },
  { name: 'service role writes weather history', role: 'service_role', sql: `insert into public.weather_hourly (spot_id, ts, temp) values ('lisi', now(), 20) returning spot_id`, rows: 1 },

  // storage
  { name: 'photos bucket exists and is public', sql: `select public, file_size_limit from storage.buckets where id = 'photos'`, check: (r) => r[0]?.public === true && Number(r[0].file_size_limit) === 8388608 },
  { name: 'user uploads into own folder', ...as(A), sql: `insert into storage.objects (bucket_id, name) values ('photos', '${A}/abc.jpg') returning id`, rows: 1 },
  { name: 'user cannot upload into another folder', ...as(A), sql: `insert into storage.objects (bucket_id, name) values ('photos', '${B}/abc.jpg')`, expect: 'error', code: '42501' },
  { name: 'anon can read photo objects', ...anon, sql: `select name from storage.objects where bucket_id = 'photos'`, rows: 1 },
  { name: 'other user cannot delete the photo', ...as(B), sql: `delete from storage.objects where name = '${A}/abc.jpg' returning id`, rows: 0 },

  // waitlist
  { name: 'anon joins the launch list', ...anon, sql: `insert into public.waitlist (email, plan, locale) values ('Someone@Example.com', 'annual', 'ka')`, check: (_r, _c, res) => res.rowCount === 1 },
  { name: 'same email + plan again is a duplicate', ...anon, sql: `insert into public.waitlist (email, plan, locale) values ('someone@example.com', 'annual', 'en')`, expect: 'error', code: '23505' },
  { name: 'garbage email is rejected', ...anon, sql: `insert into public.waitlist (email, plan) values ('not-an-email', 'annual')`, expect: 'error', code: '23514' },
  { name: 'unknown plan is rejected', ...anon, sql: `insert into public.waitlist (email, plan) values ('x@y.io', 'lifetime')`, expect: 'error', code: '23514' },
  { name: 'anon cannot read the list', ...anon, sql: `select * from public.waitlist`, expect: 'error', code: '42501' },
  { name: 'signed-in users cannot read the list either', ...as(A), sql: `select * from public.waitlist`, expect: 'error', code: '42501' },
]
