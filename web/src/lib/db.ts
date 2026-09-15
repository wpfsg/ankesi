import type { Catch, Report, Spot, SpeciesId, HourScore, Region, SpotType, DepthClass } from '../types'
import { supabase } from './supabase'
import { downscaleImage } from './image'
import { MODEL_VERSION } from './scoring'

function need() {
  if (!supabase) throw new Error('no-backend')
  return supabase
}

// ------------------------------------------------------------------ photos

export async function uploadPhoto(file: File, userId: string): Promise<string> {
  const sb = need()
  const blob = await downscaleImage(file)
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${ext}`
  const { error } = await sb.storage.from('photos').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    cacheControl: '31536000',
  })
  if (error) throw error
  return path
}

// ----------------------------------------------------------------- reports

interface ReportRow {
  id: string
  spot_id: string
  user_id: string
  activity: number
  note: string | null
  photo_path: string | null
  created_at: string
}

export async function fetchRecentReports(days = 7): Promise<Report[]> {
  const sb = need()
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const { data, error } = await sb
    .from('reports')
    .select('id, spot_id, user_id, activity, note, photo_path, created_at')
    .gte('created_at', since)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) throw error
  const rows = (data ?? []) as ReportRow[]

  const userIds = [...new Set(rows.map((r) => r.user_id))]
  const names = new Map<string, string | null>()
  if (userIds.length > 0) {
    const { data: profiles } = await sb.from('public_profiles').select('id, display_name').in('id', userIds)
    for (const p of (profiles ?? []) as Array<{ id: string; display_name: string | null }>) {
      names.set(p.id, p.display_name)
    }
  }

  return rows.map((r) => ({
    id: r.id,
    spotId: r.spot_id,
    userId: r.user_id,
    activity: r.activity,
    note: r.note,
    photoPath: r.photo_path,
    createdAt: new Date(r.created_at),
    displayName: names.get(r.user_id) ?? null,
  }))
}

export interface SnapshotInput {
  hour: HourScore | undefined
  waterTemp: number | undefined
}

function snapshot(s: SnapshotInput) {
  return s.hour
    ? {
        model: MODEL_VERSION,
        at: s.hour.time.toISOString(),
        score: s.hour.score,
        waterTemp: s.waterTemp,
        factors: s.hour.factors.map((f) => ({ key: f.key, value: f.value, raw: f.raw, state: f.state })),
      }
    : null
}

export async function insertReport(input: {
  spotId: string
  activity: number
  note?: string
  photo?: File
  userId: string
  snap: SnapshotInput
}): Promise<'ok' | 'too-soon'> {
  const sb = need()
  const photo_path = input.photo ? await uploadPhoto(input.photo, input.userId) : null
  const { error } = await sb.from('reports').insert({
    spot_id: input.spotId,
    activity: input.activity,
    note: input.note?.trim() || null,
    photo_path,
    weather_snapshot: snapshot(input.snap),
  })
  if (error) {
    if (error.code === '23505') return 'too-soon'
    throw error
  }
  return 'ok'
}

export async function flagReport(reportId: string): Promise<void> {
  const sb = need()
  const { error } = await sb.from('report_flags').insert({ report_id: reportId })
  if (error && error.code !== '23505') throw error
}

// ----------------------------------------------------------------- catches

interface CatchRow {
  id: string
  spot_id: string
  species_id: string
  caught_at: string
  weight_kg: number | null
  length_cm: number | null
  bait: string | null
  method: string | null
  note: string | null
  photo_path: string | null
  is_public: boolean
}

function toCatch(r: CatchRow): Catch {
  return {
    id: r.id,
    spotId: r.spot_id,
    speciesId: r.species_id as SpeciesId,
    caughtAt: new Date(r.caught_at),
    weightKg: r.weight_kg,
    lengthCm: r.length_cm,
    bait: r.bait,
    method: r.method,
    note: r.note,
    photoPath: r.photo_path,
    isPublic: r.is_public,
  }
}

export async function insertCatch(input: {
  spotId: string
  speciesId: SpeciesId
  weightKg?: number
  lengthCm?: number
  bait?: string
  method?: string
  note?: string
  isPublic: boolean
  photo?: File
  userId: string
  snap: SnapshotInput
}): Promise<void> {
  const sb = need()
  const photo_path = input.photo ? await uploadPhoto(input.photo, input.userId) : null
  const { error } = await sb.from('catches').insert({
    spot_id: input.spotId,
    species_id: input.speciesId,
    weight_kg: input.weightKg ?? null,
    length_cm: input.lengthCm ?? null,
    bait: input.bait?.trim() || null,
    method: input.method?.trim() || null,
    note: input.note?.trim() || null,
    is_public: input.isPublic,
    photo_path,
    weather_snapshot: snapshot(input.snap),
  })
  if (error) throw error
}

export async function fetchMyCatches(userId: string): Promise<Catch[]> {
  const sb = need()
  const { data, error } = await sb
    .from('catches')
    .select('id, spot_id, species_id, caught_at, weight_kg, length_cm, bait, method, note, photo_path, is_public')
    .eq('user_id', userId)
    .order('caught_at', { ascending: false })
    .limit(500)
  if (error) throw error
  return ((data ?? []) as CatchRow[]).map(toCatch)
}

export async function deleteCatch(id: string): Promise<void> {
  const sb = need()
  const { error } = await sb.from('catches').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------- saved spots

export async function fetchSavedSpotIds(userId: string): Promise<Set<string>> {
  const sb = need()
  const { data, error } = await sb.from('saved_spots').select('spot_id').eq('user_id', userId)
  if (error) throw error
  return new Set(((data ?? []) as Array<{ spot_id: string }>).map((r) => r.spot_id))
}

export async function setSaved(spotId: string, saved: boolean, userId: string): Promise<void> {
  const sb = need()
  if (saved) {
    const { error } = await sb.from('saved_spots').upsert({ spot_id: spotId, user_id: userId })
    if (error) throw error
  } else {
    const { error } = await sb.from('saved_spots').delete().eq('spot_id', spotId).eq('user_id', userId)
    if (error) throw error
  }
}

// -------------------------------------------------------------- paid ponds

interface SpotRow {
  id: string
  name_ka: string
  name_en: string
  type: SpotType
  region: Region
  lat: number
  lon: number
  depth: DepthClass
  species: Record<string, number>
  access_ka: string | null
  access_en: string | null
  note_ka: string | null
  note_en: string | null
  info_only: boolean
  fee_gel: number | null
  contact: string | null
  hours: string | null
}

export async function fetchApprovedPonds(): Promise<Spot[]> {
  const sb = need()
  const { data, error } = await sb
    .from('spots')
    .select('id, name_ka, name_en, type, region, lat, lon, depth, species, access_ka, access_en, note_ka, note_en, info_only, fee_gel, contact, hours')
    .eq('source', 'pond')
    .eq('approved', true)
  if (error) throw error
  return ((data ?? []) as SpotRow[]).map((r) => ({
    id: r.id,
    nameKa: r.name_ka,
    nameEn: r.name_en,
    type: r.type,
    region: r.region,
    lat: r.lat,
    lon: r.lon,
    depth: r.depth,
    species: r.species as Spot['species'],
    accessKa: [r.access_ka, r.hours, r.contact].filter(Boolean).join(' · '),
    accessEn: [r.access_en, r.hours, r.contact].filter(Boolean).join(' · '),
    noteKa: r.note_ka ?? undefined,
    noteEn: r.note_en ?? undefined,
    infoOnly: r.info_only,
    feeGel: r.fee_gel ?? undefined,
  }))
}

export async function submitPond(input: {
  nameKa: string
  nameEn: string
  lat: number
  lon: number
  region: Region
  feeGel?: number
  contact?: string
  hours?: string
  accessKa?: string
  accessEn?: string
  userId: string
}): Promise<void> {
  const sb = need()
  const slug = input.nameEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const id = `pond-${slug || 'pond'}-${crypto.randomUUID().slice(0, 6)}`
  const { error } = await sb.from('spots').insert({
    id,
    name_ka: input.nameKa.trim(),
    name_en: input.nameEn.trim(),
    type: 'paid',
    region: input.region,
    lat: input.lat,
    lon: input.lon,
    depth: 'shallow',
    species: { carp: 0.7, crucian: 0.3 },
    access_ka: input.accessKa?.trim() || null,
    access_en: input.accessEn?.trim() || null,
    fee_gel: input.feeGel ?? null,
    contact: input.contact?.trim() || null,
    hours: input.hours?.trim() || null,
    source: 'pond',
    owner_id: input.userId,
    approved: false,
  })
  if (error) throw error
}
