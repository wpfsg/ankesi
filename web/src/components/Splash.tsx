import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import './splash.css'

interface Props {
  /** 'map' while tiles load, 'weather' while the first forecast loads. */
  stage: 'map' | 'weather'
}

/**
 * "The Cast": a telescopic rod unfolds, casts, the float lands with ripples,
 * a fish rises and pulls it under, repeat. Inline SVG + CSS keyframes only.
 */
export function Splash({ stage }: Props) {
  const { t } = useTranslation()
  return (
    <motion.div
      className="splash"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      role="status"
      aria-live="polite"
    >
      <div className="splash-card glass">
        <svg className="cast" viewBox="0 0 320 200" width="100%" aria-hidden="true">
          <defs>
            <clipPath id="under">
              <rect x="0" y="140" width="320" height="60" />
            </clipPath>
            <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="water-top" />
              <stop offset="1" className="water-bottom" />
            </linearGradient>
          </defs>

          {/* water body + two parallax wave surfaces */}
          <rect className="water" x="0" y="142" width="320" height="58" fill="url(#waterFill)" />
          <path
            className="wave wave-back"
            d="M0 143 Q20 138 40 143 T80 143 T120 143 T160 143 T200 143 T240 143 T280 143 T320 143 T360 143 T400 143 T440 143 T480 143 T520 143 T560 143 T600 143 T640 143 V200 H0 Z"
          />
          <path
            className="wave wave-front"
            d="M0 146 Q25 140 50 146 T100 146 T150 146 T200 146 T250 146 T300 146 T350 146 T400 146 T450 146 T500 146 T550 146 T600 146 T650 146 V200 H0 Z"
          />

          {/* fish and bubbles, visible only under the surface */}
          <g clipPath="url(#under)">
            <g className="fish">
              <path d="M-18 0c6-9 20-9 28-1 3 3 3 5 0 8-8 7-22 7-28 0-3-3-3-4 0-7z" />
              <path d="M9 0l10-8v16z" />
              <circle cx="-9" cy="-1.5" r="1.4" className="fish-eye" />
            </g>
            <circle className="air b1" cx="236" cy="152" r="1.4" />
            <circle className="air b2" cx="244" cy="156" r="1" />
            <circle className="air b3" cx="240" cy="160" r="1.2" />
          </g>

          {/* ripples and droplets at the landing point */}
          <ellipse className="ripple r1" cx="240" cy="141" rx="16" ry="4" />
          <ellipse className="ripple r2" cx="240" cy="141" rx="16" ry="4" />
          <ellipse className="ripple r3" cx="240" cy="141" rx="16" ry="4" />
          <circle className="drop d1" cx="240" cy="140" r="1.6" />
          <circle className="drop d2" cx="240" cy="140" r="1.3" />
          <circle className="drop d3" cx="240" cy="140" r="1.1" />

          {/* line: flight arc, then taut during the bite */}
          <path className="line line-arc" d="M124 79 Q 200 28 240 138" pathLength="100" />
          <path className="line line-taut" d="M128 84 L 240 150" pathLength="100" />

          {/* float */}
          <g className="float">
            <line x1="0" y1="-9" x2="0" y2="6" className="float-stem" />
            <ellipse cx="0" cy="-1" rx="3.2" ry="5" className="float-body" />
            <path d="M-3.2 -1a3.2 5 0 0 0 6.4 0z" className="float-belly" />
            <circle cx="0" cy="-9" r="1.3" className="float-tip" />
          </g>

          {/* shore and rod */}
          <ellipse className="shore" cx="44" cy="152" rx="26" ry="3" />
          <g className="rod">
            <line className="handle" x1="40" y1="150" x2="40" y2="110" />
            <circle className="reel" cx="43" cy="132" r="5" />
            <g className="seg seg1">
              <line x1="40" y1="110" x2="40" y2="72" />
              <circle className="guide" cx="40" cy="74" r="1.6" />
            </g>
            <g className="seg seg2">
              <line x1="40" y1="110" x2="40" y2="82" />
              <circle className="guide" cx="40" cy="84" r="1.4" />
            </g>
            <g className="seg seg3">
              <line x1="40" y1="110" x2="40" y2="88" />
              <circle className="guide" cx="40" cy="90" r="1.2" />
            </g>
            <g className="seg seg4">
              <g className="tip">
                <line x1="40" y1="110" x2="40" y2="92" />
                <circle className="guide" cx="40" cy="93" r="1.1" />
              </g>
            </g>
          </g>
        </svg>

        <div className="splash-brand">{t('app.title')}</div>
        <div className="splash-tagline">{t('app.tagline')}</div>
        <div className="splash-status">
          {stage === 'map' ? t('loader.map') : t('loader.weather')}
          <span className="dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </motion.div>
  )
}
