export type SpotType = 'lake' | 'reservoir' | 'river' | 'paid' | 'sea'

export type DepthClass = 'shallow' | 'medium' | 'deep' | 'river' | 'sea'

export type Region =
  | 'tbilisi'
  | 'kvemo-kartli'
  | 'mtskheta-mtianeti'
  | 'kakheti'
  | 'shida-kartli'
  | 'samtskhe-javakheti'
  | 'imereti'
  | 'racha'
  | 'samegrelo'
  | 'guria'
  | 'adjara'

export type SpeciesId =
  | 'carp'
  | 'catfish'
  | 'crucian'
  | 'trout'
  | 'barbel'
  | 'chub'
  | 'khramulya'
  | 'pikeperch'
  | 'pike'
  | 'perch'
  | 'silvercarp'
  | 'mullet'
  | 'redmullet'
  | 'horsemackerel'
  | 'herring'
  | 'sturgeon'

export interface Spot {
  id: string
  nameKa: string
  nameEn: string
  type: SpotType
  region: Region
  lat: number
  lon: number
  depth: DepthClass
  /** Share of each species in typical catches. Should sum to ~1. */
  species: Partial<Record<SpeciesId, number>>
  accessKa: string
  accessEn: string
  noteKa?: string
  noteEn?: string
  /** Fishing is not confirmed to be allowed here. Show as info only. */
  infoOnly?: boolean
  /** Paid ponds: fee per day in GEL, if known. */
  feeGel?: number
  /** Sea spots: coordinate offshore used for the marine API query. */
  marineLat?: number
  marineLon?: number
}

export interface Species {
  id: SpeciesId
  nameKa: string
  nameEn: string
  tempMin: number
  tempMax: number
  /** Months (1-12) when the species is normally targeted. */
  months: number[]
  nocturnal?: boolean
  /** Legally protected. Never a target; shown with a warning. */
  protectedSpecies?: boolean
}

export interface HourlyWeather {
  time: Date
  temp: number
  pressure: number
  wind: number
  windDir: number
  cloud: number
  precip: number
}

export interface MarineHourly {
  time: Date
  /** metres, null when the grid has no sea data for the point */
  waveHeight: number | null
  /** °C sea surface temperature, null when unavailable */
  sst: number | null
}

export interface SpotWeather {
  spotId: string
  hourly: HourlyWeather[]
  marine?: MarineHourly[]
  fetchedAt: Date
}

export type FactorKey =
  | 'pressureTrend'
  | 'pressureLevel'
  | 'waterTemp'
  | 'wind'
  | 'light'
  | 'water'
  | 'waves'
  | 'timeOfDay'
  | 'moon'
  | 'season'

export interface FactorResult {
  key: FactorKey
  weight: number
  /** 0..1 */
  value: number
  /** Raw measured or estimated quantity behind the factor. */
  raw: number
  unit: string
  /** i18n suffix describing the state, e.g. 'rising', 'stable'. */
  state?: string
  /** True when the raw value is modeled rather than measured. */
  estimated?: boolean
}

export interface HourScore {
  time: Date
  score: number
  factors: FactorResult[]
}

export type Confidence = 'low' | 'medium' | 'high'

export interface CommunityAdjustment {
  /** Points added to every hour's score, clamped to ±15. */
  delta: number
  /** Reports in the last 7 days that fed the adjustment. */
  count: number
}

export interface SpotResult {
  spotId: string
  hours: HourScore[]
  /** Water temperature used for scoring. */
  waterTemp: number
  /** True when waterTemp is estimated from air temperature. */
  waterTempEstimated: boolean
  confidence: Confidence
  fetchedAt: Date
  community?: CommunityAdjustment
}

/** Community activity report. activity: -2 dead … +2 great. */
export interface Report {
  id: string
  spotId: string
  userId: string
  activity: number
  note: string | null
  photoPath: string | null
  createdAt: Date
  displayName: string | null
}

export interface Catch {
  id: string
  spotId: string
  speciesId: SpeciesId
  caughtAt: Date
  weightKg: number | null
  lengthCm: number | null
  bait: string | null
  method: string | null
  note: string | null
  photoPath: string | null
  isPublic: boolean
}

export type Band = 'none' | 'dead' | 'slow' | 'ok' | 'good' | 'great'
