import type { HourScore } from '../types'
import { bandOf } from '../lib/scoring'
import { fmtHour } from '../lib/format'

interface Props {
  hours: HourScore[]
  count?: number
}

/** 48 thin bars, one per hour, colored by band. Labels every 6 hours. */
export function ScoreStrip({ hours, count = 48 }: Props) {
  const shown = hours.slice(0, count)
  return (
    <div>
      <div className="strip" role="img" aria-label="48h">
        {shown.map((h, i) => (
          <div
            key={h.time.getTime()}
            className={`bar${i === 0 ? ' now' : ''}`}
            data-band={bandOf(h.score)}
            style={{ height: `${Math.max(4, h.score)}%` }}
            title={`${fmtHour(h.time)}:00 · ${h.score}`}
          />
        ))}
      </div>
      <div className="strip-labels">
        {shown.map((h, i) => (
          <span key={h.time.getTime()}>{i % 6 === 0 ? fmtHour(h.time) : ''}</span>
        ))}
      </div>
    </div>
  )
}
