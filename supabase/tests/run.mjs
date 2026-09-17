// Schema and row-level-security check on an embedded Postgres, no Docker.
// stubs.sql stands in for Supabase's auth/storage schemas and API roles;
// then every migration and the seed are applied, then scenarios.mjs runs as
// anon, signed-in users and the service role. Usage: npm test
import EmbeddedPostgres from 'embedded-postgres'
import pg from 'pg'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const migrationsDir = resolve(here, '../migrations')
const migrations = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((f) => join(migrationsDir, f))
const seed = resolve(here, '../seed.sql')
const PORT = Number(process.env.PGPORT_TEST ?? 54329)
const dataDir = join(here, 'data')
rmSync(dataDir, { recursive: true, force: true })

const quiet = () => {}
const epg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'pw',
  port: PORT,
  persistent: false,
  onLog: quiet,
  onError: quiet,
})
await epg.initialise()
await epg.start()
const client = new pg.Client({ host: '127.0.0.1', port: PORT, user: 'postgres', password: 'pw', database: 'postgres' })
await client.connect()

let failed = 0

async function applyFile(label, path) {
  const sql = readFileSync(path, 'utf8')
  try {
    await client.query(sql)
    console.log(`OK    ${label}`)
    return true
  } catch (e) {
    failed++
    console.log(`FAIL  ${label}: [${e.code}] ${e.message}`)
    if (e.position) {
      const line = sql.slice(0, Number(e.position)).split('\n').length
      console.log(`      at line ${line}: ${sql.split('\n')[line - 1].trim()}`)
    }
    return false
  }
}

try {
  let ok = await applyFile('stubs', join(here, 'stubs.sql'))
  for (const m of migrations) ok = ok && (await applyFile(`migration ${m.split('/').pop()}`, m))
  ok = ok && (await applyFile('seed', seed))

  if (ok) {
    const { tests } = await import(join(here, 'scenarios.mjs'))
    const ctx = { client, users: {} }
    for (const t of tests) {
      // One transaction per scenario as the given role/user, committed on
      // success so later scenarios build on it.
      await client.query('begin')
      try {
        if (t.role) await client.query(`set local role ${t.role}`)
        if (t.sub) await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: t.sub, role: t.role })])
        const raw = await client.query(typeof t.sql === 'function' ? t.sql(ctx) : t.sql)
        await client.query('commit')
        // Multi-statement strings come back as one result per statement.
        const res = Array.isArray(raw) ? raw[raw.length - 1] : raw
        const rows = res.rows ?? []
        const problem =
          t.expect === 'error'
            ? `expected an error${t.code ? ` (${t.code})` : ''} but it succeeded`
            : t.rows !== undefined && rows.length !== t.rows
              ? `expected ${t.rows} rows, got ${rows.length}`
              : t.check && !t.check(rows, ctx, res)
                ? `check failed: ${JSON.stringify(rows)}`
                : null
        if (problem) {
          failed++
          console.log(`FAIL  ${t.name}: ${problem}`)
        } else console.log(`OK    ${t.name}`)
        t.after?.(rows, ctx)
      } catch (e) {
        await client.query('rollback')
        if (t.expect === 'error' && (!t.code || t.code === e.code)) console.log(`OK    ${t.name} (rejected: [${e.code}] ${e.message})`)
        else {
          failed++
          console.log(`FAIL  ${t.name}: [${e.code}] ${e.message}`)
        }
      }
    }
  }
} finally {
  await client.end()
  await epg.stop()
}

console.log(failed ? `\n${failed} problem(s)` : '\nall good')
process.exit(failed ? 1 : 0)
