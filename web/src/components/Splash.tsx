import { useEffect } from 'react'
import { animate, cubicBezier, easeIn, easeInOut, easeOut, motion, useMotionValue, useReducedMotion, useTransform, type EasingFunction, type MotionValue } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { BRAND_GLYPHS, BRAND_STROKE_WIDTH, type BrandGlyph } from '../data/brand'
import {
  Dots,
  Glint,
  HillFarLit,
  HillFarShade,
  HillNearLit,
  HillNearShade,
  Ink,
  Line,
  Night,
  Ripple,
  Scene,
  Sheen,
  SheenStop,
  SkyHorizon,
  SkyTop,
  SplashCard,
  SplashRoot,
  SplashStatus,
  SplashTagline,
  Sun,
  SunGlowInner,
  SunGlowOuter,
  SunGroup,
  Swing,
  WaterBottom,
  WaterTop,
  WaveBack,
  WaveFront,
  WaveMid,
} from './Splash.styles'

interface Props {
  /** 'map' while tiles load, 'weather' while the first forecast loads. */
  stage: 'map' | 'weather'
}

/* ---------- scene geometry (viewBox units) ---------- */

const SCENE_W = 400
const SCENE_H = 210
const WATER_Y = 150
const SUN = { x: 336, y: 46 }
/** The word (data/brand.ts coordinates) is placed with this transform. */
const WORD_SCALE = 0.85
const WORD_X = 46
const WORD_Y = 40

const HOOK = 'კ'
/** Where the line ties onto კ (word coordinates). */
const HOOK_TIE = { x: 152, y: 58 }
/** Where its point breaks the surface (scene coordinates). */
const HOOK_TIP_X = WORD_X + 153 * WORD_SCALE
/** How far above its resting place the hook starts. */
const DROP = 240

/* ---------- timeline ----------
   One loop in seconds; every moment below is a fraction of it. A single
   clock (0→1) drives every part, so heavy frames while the map loads can
   slow the whole sequence but never pull its parts out of step.

   Letters are written in order with time proportional to stroke length,
   the pen lifting briefly between them. კ is not written: it is lowered in
   on the line. */

const LOOP = 6.2
const WRITE_SHARE = 0.4
const LIFT = 0.015
const DROP_DUR = 0.08

type Span = { start: number; end: number }
const plan = new Map<string, Span>()
let drop: Span = { start: 0, end: 0 }
{
  const written = BRAND_GLYPHS.filter((g) => g.ch !== HOOK)
  const total = written.reduce((n, g) => n + g.length, 0)
  let t = 0.04
  for (const g of BRAND_GLYPHS) {
    if (g.ch === HOOK) {
      drop = { start: t, end: t + DROP_DUR }
      t = drop.end + LIFT + 0.02
    } else {
      const d = (g.length / total) * WRITE_SHARE
      plan.set(g.ch, { start: t, end: t + d })
      t += d + LIFT
    }
  }
}
const SHEEN: Span = { start: 0.74, end: 0.86 }
const FADE: Span = { start: 0.91, end: 0.96 }

const linear: EasingFunction = (t) => t
/** Pen-like pacing: slow into the stroke, quick through it, slow out. */
const pen = cubicBezier(0.45, 0.05, 0.55, 0.95)
/** The hook settles with a small overshoot as the line goes taut. */
const settle = cubicBezier(0.3, 0.9, 0.4, 1.12)

const SHEEN_W = 110

/* ---------- clock-driven pieces ---------- */

type Clock = MotionValue<number>

/** Runs 0→1 once per loop, forever. */
function useClock(): Clock {
  const clock = useMotionValue(0)
  useEffect(() => {
    const controls = animate(clock, [0, 1], { duration: LOOP, ease: 'linear', repeat: Infinity, repeatType: 'loop' })
    return () => controls.stop()
  }, [clock])
  return clock
}

/** A thick round stroke along the centerline, drawn in over `span`. */
function InkMask({ glyph, span, clock }: { glyph: BrandGlyph; span: Span; clock: Clock }) {
  const pathLength = useTransform(clock, [0, span.start, span.end, 1], [0, 0, 1, 1], { ease: [linear, pen, linear] })
  /* a zero-length dash still draws its round caps, so stay hidden until the stroke begins */
  const opacity = useTransform(clock, [0, span.start, span.start + 0.002, 1], [0, 0, 1, 1])
  return (
    <mask id={`ink-${glyph.ch}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="400" height="200">
      <motion.path
        d={glyph.stroke}
        fill="none"
        stroke="#fff"
        strokeWidth={BRAND_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength, opacity }}
      />
    </mask>
  )
}

function SheenBand({ clock }: { clock: Clock }) {
  const x = useTransform(clock, [0, SHEEN.start, SHEEN.end, 1], [-SHEEN_W, -SHEEN_W, 380, 380], { ease: [linear, easeInOut, linear] })
  return <motion.rect y="-20" width={SHEEN_W} height="200" fill="url(#sheen-grad)" style={{ x }} />
}

/** კ on its line, lowered from above the scene. */
function HookOnLine({ glyph, clock }: { glyph: BrandGlyph; clock: Clock }) {
  const y = useTransform(clock, [0, drop.start, drop.end, 1], [-DROP, -DROP, 0, 0], { ease: [linear, settle, linear] })
  return (
    <motion.g style={{ y }}>
      <Swing>
        <Line x1={HOOK_TIE.x} y1={-600} x2={HOOK_TIE.x} y2={HOOK_TIE.y} />
        <Ink d={glyph.outline} />
      </Swing>
    </motion.g>
  )
}

/** One ring spreading from where the hook breaks the surface. */
function RippleRing({ clock, at }: { clock: Clock; at: number }) {
  const scale = useTransform(clock, [0, at, at + 0.11, 1], [0, 0, 1, 1], { ease: [linear, easeOut, linear] })
  const opacity = useTransform(clock, [0, at, at + 0.01, at + 0.11, 1], [0, 0, 0.9, 0, 0])
  return (
    <Ripple cx={HOOK_TIP_X} cy={WATER_Y} rx="24" ry="5.5" style={{ scale, opacity, transformBox: 'fill-box', transformOrigin: 'center' }} />
  )
}

/** The whole animated word; invisible at both ends of the loop. */
function Signature({ clock }: { clock: Clock }) {
  const opacity = useTransform(clock, [0, 0.03, FADE.start, FADE.end, 1], [0, 1, 1, 0, 0], { ease: [easeOut, linear, easeIn, linear] })
  const hook = BRAND_GLYPHS.find((g) => g.ch === HOOK)!
  return (
    <>
      <defs>
        {BRAND_GLYPHS.map((g) => {
          const span = plan.get(g.ch)
          return span ? <InkMask key={g.ch} glyph={g} span={span} clock={clock} /> : null
        })}
        <linearGradient id="sheen-grad" x1="0" y1="0" x2="1" y2="0">
          <SheenStop offset="0" $a={0} />
          <SheenStop offset="0.5" $a={1} />
          <SheenStop offset="1" $a={0} />
        </linearGradient>
        <mask id="sheen" maskUnits="userSpaceOnUse" x="-20" y="-20" width="400" height="200">
          <SheenBand clock={clock} />
        </mask>
      </defs>

      <motion.g transform={`translate(${WORD_X} ${WORD_Y}) scale(${WORD_SCALE})`} style={{ opacity }}>
        {/* the written letters */}
        {BRAND_GLYPHS.map((g) =>
          g.ch === HOOK ? null : (
            <g key={g.ch} mask={`url(#ink-${g.ch})`}>
              <Ink d={g.outline} />
            </g>
          ),
        )}

        <HookOnLine glyph={hook} clock={clock} />

        {/* accent sheen once the signature is complete */}
        <g mask="url(#sheen)">
          {BRAND_GLYPHS.map((g) => (
            <Sheen key={g.ch} d={g.outline} />
          ))}
        </g>
      </motion.g>
    </>
  )
}

/** Reduced motion: the finished word, hook on its line, nothing moving. */
function StillSignature() {
  const hook = BRAND_GLYPHS.find((g) => g.ch === HOOK)!
  return (
    <g transform={`translate(${WORD_X} ${WORD_Y}) scale(${WORD_SCALE})`}>
      {BRAND_GLYPHS.map((g) => (g.ch === HOOK ? null : <Ink key={g.ch} d={g.outline} />))}
      <Line x1={HOOK_TIE.x} y1={-600} x2={HOOK_TIE.x} y2={HOOK_TIE.y} />
      <Ink d={hook.outline} />
    </g>
  )
}

/**
 * "The Signature": ანკესი writes itself; კ arrives on a fishing line.
 * Glyph outlines and stroke centerlines live in data/brand.ts.
 */
export function Splash({ stage }: Props) {
  const { t } = useTranslation()
  const still = useReducedMotion()
  const clock = useClock()
  const title = BRAND_GLYPHS.map((g) => g.ch).join('')

  return (
    <SplashRoot
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -24, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }}
      role="status"
      aria-live="polite"
    >
      <SplashCard>
        <Scene viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} role="img" aria-label={title}>
          <defs>
            <linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1">
              <SkyTop offset="0" />
              <SkyHorizon offset="1" />
            </linearGradient>
            <radialGradient id="sun-glow">
              <SunGlowInner offset="0" />
              <SunGlowOuter offset="1" />
            </radialGradient>
            {/* hills lit from the sun's side */}
            <linearGradient id="hill-far-fill" x1="0" y1="0" x2="1" y2="0">
              <HillFarShade offset="0" />
              <HillFarLit offset="1" />
            </linearGradient>
            <linearGradient id="hill-near-fill" x1="0" y1="0" x2="1" y2="0">
              <HillNearShade offset="0" />
              <HillNearLit offset="1" />
            </linearGradient>
            <filter id="soften" x="-30%" y="-100%" width="160%" height="300%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
            <linearGradient id="water-fill" x1="0" y1="0" x2="0" y2="1">
              <WaterTop offset="0" />
              <WaterBottom offset="1" />
            </linearGradient>
          </defs>

          {/* sky, then the sun rising from behind the hills */}
          <rect x="0" y="0" width={SCENE_W} height={WATER_Y} fill="url(#sky-fill)" />
          <SunGroup>
            <circle cx={SUN.x} cy={SUN.y} r="58" fill="url(#sun-glow)" />
            <Sun cx={SUN.x} cy={SUN.y} r="17" />
          </SunGroup>
          <path d="M0 152C70 112 130 128 190 136S300 104 400 128V210H0Z" fill="url(#hill-far-fill)" />
          <path d="M0 162C60 140 110 150 170 156S300 140 400 152V210H0Z" fill="url(#hill-near-fill)" />

          {still ? <StillSignature /> : <Signature clock={clock} />}

          {/* water, drawn last so the descenders read as submerged */}
          <rect x="0" y={WATER_Y} width={SCENE_W} height={SCENE_H - WATER_Y} fill="url(#water-fill)" />
          <Glint cx={SUN.x} cy={WATER_Y + 16} rx="64" ry="8" />
          <WaveBack d="M0 152Q30 144 60 152T120 152T180 152T240 152T300 152T360 152T420 152T480 152T540 152T600 152T660 152T720 152T780 152T840 152V210H0Z" />
          <WaveMid d="M0 155Q40 147 80 155T160 155T240 155T320 155T400 155T480 155T560 155T640 155T720 155T800 155T880 155V210H0Z" />
          <WaveFront d="M0 158Q25 152 50 158T100 158T150 158T200 158T250 158T300 158T350 158T400 158T450 158T500 158T550 158T600 158T650 158T700 158T750 158T800 158V210H0Z" />

          {/* ripples where the hook breaks the surface */}
          {!still && [0, 0.03].map((lag) => <RippleRing key={lag} clock={clock} at={drop.end + lag} />)}

          {/* dawn: a night tint over the scene that lifts as the sun rises */}
          <Night x="0" y="0" width={SCENE_W} height={SCENE_H} />
        </Scene>

        <SplashTagline>{t('app.tagline')}</SplashTagline>
        <SplashStatus>
          {stage === 'map' ? t('loader.map') : t('loader.weather')}
          <Dots aria-hidden="true">
            <span />
            <span />
            <span />
          </Dots>
        </SplashStatus>
      </SplashCard>
    </SplashRoot>
  )
}
