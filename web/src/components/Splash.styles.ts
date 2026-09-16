import { motion } from 'framer-motion'
import styled, { keyframes } from 'styled-components'
import { glass } from '../styles/shared'

/* "The Signature" loader: ანკესი writes itself in a calligraphic hand while
   კ, shaped like a hook, is lowered into the word on a fishing line. Behind
   it a sunrise: the sun climbs from behind two hills and lights the scene,
   with water the descenders dip into. The
   sequence is driven by one framer-motion clock (see Splash.tsx); the waves,
   the hook's swing and the status dots are free-running CSS animations. */

const dot = keyframes`
  0%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-2px);
  }
`

/* waves slide one full period while bobbing gently up and down */
const waveSlide = keyframes`
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-200px, 2px);
  }
  100% {
    transform: translate(-400px, 0);
  }
`

/* the sun climbs from behind the hills once, when the loader appears */
const sunrise = keyframes`
  from {
    transform: translateY(120px);
  }
  to {
    transform: translateY(0);
  }
`

/* night tint over the scene that lifts as the sun comes up */
const dawn = keyframes`
  from {
    opacity: 0.55;
  }
  to {
    opacity: 0;
  }
`

/* the hook and its line sway like a pendulum hung from the top of the line */
const swing = keyframes`
  from {
    transform: rotate(-0.6deg);
  }
  to {
    transform: rotate(0.6deg);
  }
`

/* ---------- root + card ---------- */

export const SplashRoot = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 24px 16px;
`

export const SplashCard = styled.div`
  ${glass}
  position: relative; /* above the backdrop */
  width: min(92vw, 480px);
  border-radius: var(--radius-lg);
  padding: 0 0 26px;
  overflow: hidden;
  text-align: center;
  box-sizing: border-box;
`

/* ---------- scene ---------- */

/* A painted sunrise, the same in both themes; the word is inked in a fixed
   deep colour so it reads on the bright scene regardless of theme. */
export const Scene = styled.svg`
  --sky-top: #bfdcff;
  --sky-horizon: #ffe2bf;
  --sun: #ffc857;
  --sun-glow: #fff0bf;
  --hill-far-shade: #a9cf9e;
  --hill-far-lit: #e4f0c3;
  --hill-near-shade: #6fa77c;
  --hill-near-lit: #b9d99c;
  --water-top: #a6dcda;
  --water-deep: #62b4b8;
  --wave: rgba(255, 255, 255, 0.45);
  --night: #22355e;
  --ink: #16303a;
  --line: #365463;
  --sheen: #f3b942;
  display: block;
  width: 100%;
  height: auto;
`

export const SkyTop = styled.stop`
  stop-color: var(--sky-top);
`
export const SkyHorizon = styled.stop`
  stop-color: var(--sky-horizon);
`

/** Sun plus its glow; rises once on mount. */
export const SunGroup = styled.g`
  animation: ${sunrise} 4.8s cubic-bezier(0.2, 0.6, 0.2, 1) 0.2s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`
export const Sun = styled.circle`
  fill: var(--sun);
`
export const SunGlowInner = styled.stop`
  stop-color: var(--sun-glow);
  stop-opacity: 0.95;
`
export const SunGlowOuter = styled.stop`
  stop-color: var(--sun-glow);
  stop-opacity: 0;
`

export const HillFarShade = styled.stop`
  stop-color: var(--hill-far-shade);
`
export const HillFarLit = styled.stop`
  stop-color: var(--hill-far-lit);
`
export const HillNearShade = styled.stop`
  stop-color: var(--hill-near-shade);
`
export const HillNearLit = styled.stop`
  stop-color: var(--hill-near-lit);
`

export const WaterTop = styled.stop`
  stop-color: var(--water-top);
`
export const WaterBottom = styled.stop`
  stop-color: var(--water-deep);
`

/** Warm light on the water under the sun. */
export const Glint = styled.ellipse`
  fill: var(--sun-glow);
  opacity: 0.7;
  filter: url(#soften);
  animation: ${dawn} 4.8s ease-out 0.2s both reverse;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** Night tint over everything but the word; lifts with the sunrise. */
export const Night = styled.rect`
  fill: var(--night);
  opacity: 0;
  pointer-events: none;
  animation: ${dawn} 4.8s ease-out 0.2s both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const wave = `
  will-change: transform;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`
export const WaveBack = styled.path`
  ${wave}
  fill: var(--wave);
  opacity: 0.5;
  animation-name: ${waveSlide};
  animation-duration: 11s;
`
export const WaveMid = styled.path`
  ${wave}
  fill: var(--wave);
  opacity: 0.7;
  animation-name: ${waveSlide};
  animation-duration: 7.5s;
  animation-direction: reverse;
`
export const WaveFront = styled.path`
  ${wave}
  fill: var(--wave);
  animation-name: ${waveSlide};
  animation-duration: 5.5s;
`

/* ---------- word ---------- */

/** Filled glyph outlines, revealed through the ink masks. */
export const Ink = styled.path`
  fill: var(--ink);
`

/** Accent-tinted copy of the word that a soft band sweeps across once written. */
export const Sheen = styled.path`
  fill: var(--sheen);
`

export const SheenStop = styled.stop<{ $a: number }>`
  stop-color: var(--sheen);
  stop-opacity: ${(p) => p.$a};
`

/** Wraps the line and კ; pivots at the top of the line so both sway together. */
export const Swing = styled.g`
  transform-box: fill-box;
  transform-origin: 55% 0;
  animation: ${swing} 2.8s ease-in-out infinite alternate;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

/** The fishing line კ hangs from. */
export const Line = styled.line`
  stroke: var(--line);
  stroke-width: 1;
  stroke-linecap: round;
`

/** Rings where the hook breaks the surface; scale and opacity come from the clock. */
export const Ripple = styled(motion.ellipse)`
  fill: none;
  stroke: rgba(255, 255, 255, 0.9);
  stroke-width: 1.8;
`

/* ---------- text ---------- */

export const SplashTagline = styled.div`
  margin-top: 14px;
  padding: 0 24px;
  color: var(--fg-2);
  font-size: 14px;
  line-height: 1.35;
  text-wrap: balance;
`

export const SplashStatus = styled.div`
  margin-top: 14px;
  padding: 0 24px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--fg-3);
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  column-gap: 8px;
  row-gap: 2px;
  text-wrap: balance;
`

export const Dots = styled.span`
  flex: none;
  display: inline-flex;
  gap: 3px;

  span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--fg-3);
    animation: ${dot} 1.2s ease-in-out infinite;
  }
  span:nth-child(2) {
    animation-delay: 0.2s;
  }
  span:nth-child(3) {
    animation-delay: 0.4s;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
      opacity: 0.6;
    }
  }
`
