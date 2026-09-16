import type { HourScore } from '../types'
import { bandOf } from '../lib/scoring'
import { fmtHour } from '../lib/format'
import { Strip, Bar, Highlight, Axis } from './ScoreStrip.styles'

interface Props {
  hours: HourScore[]
  count?: number
  /** Time range to mark over the bars, e.g. the best window. */
  highlight?: { start: Date; end: Date }
}

/** 48 thin bars, one per hour, colored by band. Labels every 6 hours. */
export function ScoreStrip({ hours, count = 48, highlight }: Props) {
  const shown = hours.slice(0, count)
  const n = shown.length

  let band: { left: string; right: string } | null = null
  if (highlight && n > 0) {
    const from = highlight.start.getTime()
    const to = highlight.end.getTime()
    let first = -1
    let last = -1
    shown.forEach((h, i) => {
      const ms = h.time.getTime()
      if (ms >= from && ms < to) {
        if (first < 0) first = i
        last = i
      }
    })
    if (first >= 0) {
      band = {
        left: `${(first / n) * 100}%`,
        right: `${((n - last - 1) / n) * 100}%`,
      }
    }
  }

  return (
    <div>
      <Strip role="img" aria-label="48h">
        {shown.map((h, i) => (
          <Bar
            key={h.time.getTime()}
            $now={i === 0}
            data-band={bandOf(h.score)}
            style={{ height: `${Math.max(4, h.score)}%` }}
            title={`${fmtHour(h.time)}:00 · ${h.score}`}
          />
        ))}
        {band && <Highlight style={band} />}
      </Strip>
      <Axis>
        {shown.filter((_, i) => i % 6 === 0).map((h) => (
          <span key={h.time.getTime()}>{fmtHour(h.time)}</span>
        ))}
      </Axis>
    </div>
  )
}
