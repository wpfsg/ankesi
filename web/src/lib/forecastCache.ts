/**
 * Per-location localStorage cache for Open-Meteo responses.
 *
 * Open-Meteo counts every location in a request as one API call, so a page
 * load with ~110 spots costs ~110 of the free tier's 5,000 calls per hour.
 * Caching each location's series for an hour makes reloads free, lets the
 * app fetch only spots the cache lacks, and keeps the last good data on
 * screen when the provider refuses a request.
 */

export const FRESH_MS = 55 * 60 * 1000
/** How long stale data may still be shown when a refresh fails. */
export const STALE_MS = 12 * 60 * 60 * 1000

interface Entry<T> {
  fetchedAt: number
  data: T
}

interface Store<T> {
  v: number
  /** Request shape (days, variables); a change invalidates everything. */
  sig: string
  entries: Record<string, Entry<T>>
}

export class ForecastCache<T> {
  private readonly key: string
  private readonly sig: string
  private readonly version: number
  private store: Store<T>

  constructor(key: string, sig: string, version = 1) {
    this.key = key
    this.sig = sig
    this.version = version
    this.store = this.read()
  }

  private read(): Store<T> {
    try {
      const raw = localStorage.getItem(this.key)
      if (raw) {
        const parsed = JSON.parse(raw) as Store<T>
        if (parsed.v === this.version && parsed.sig === this.sig && parsed.entries) return parsed
      }
    } catch {
      // corrupt or unavailable storage: start empty
    }
    return { v: this.version, sig: this.sig, entries: {} }
  }

  private write() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.store))
    } catch {
      // quota or private mode: caching is best-effort
    }
  }

  /** Entry younger than FRESH_MS, or undefined. */
  fresh(id: string, now = Date.now()): Entry<T> | undefined {
    const e = this.store.entries[id]
    return e && now - e.fetchedAt < FRESH_MS ? e : undefined
  }

  /** Entry younger than STALE_MS, or undefined. */
  stale(id: string, now = Date.now()): Entry<T> | undefined {
    const e = this.store.entries[id]
    return e && now - e.fetchedAt < STALE_MS ? e : undefined
  }

  put(id: string, data: T, fetchedAt = Date.now()) {
    this.store.entries[id] = { fetchedAt, data }
  }

  /** Persist and drop entries older than STALE_MS. */
  flush(now = Date.now()) {
    for (const [id, e] of Object.entries(this.store.entries)) {
      if (now - e.fetchedAt >= STALE_MS) delete this.store.entries[id]
    }
    this.write()
  }
}

/** Thrown when the provider rejects the request for quota reasons. */
export class RateLimitError extends Error {
  constructor(message = 'Forecast provider rate limit reached') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export async function checkResponse(res: Response, label: string): Promise<void> {
  if (res.ok) return
  if (res.status === 429) throw new RateLimitError()
  // Open-Meteo also answers limit errors with 400 + a reason string.
  if (res.status === 400) {
    const text = await res.text().catch(() => '')
    if (/limit exceeded/i.test(text)) throw new RateLimitError()
  }
  throw new Error(`${label} responded ${res.status}`)
}

/**
 * Runs fetches one after another so a second call issued while the first is
 * in flight (StrictMode, ponds arriving) sees the freshly written cache and
 * only requests what is still missing.
 */
export function serialized<A extends unknown[], R>(fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  let chain: Promise<unknown> = Promise.resolve()
  return (...args: A) => {
    const run = chain.then(() => fn(...args))
    chain = run.catch(() => undefined)
    return run
  }
}
