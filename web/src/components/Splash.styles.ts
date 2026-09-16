import { motion } from 'framer-motion'
import styled, { css, keyframes } from 'styled-components'
import { glass } from '../styles/shared'

/* "The Cast" loader. One loop = var(--loop). The first loop is preceded by
   the rod unfolding (var(--unfold)); loop animations are delayed by that
   much and use fill-mode backwards so their 0% state shows meanwhile.

   Loop timeline (percent of 3.6 s):
     0–16  cast: rod back, then whip forward
    16–42  line draws out, float flies the arc
    42–58  splash: ripples, droplets, float settles and bobs
    58–82  bite: fish rises, float dips, line taut, rod pulled
    82–100 reset */

type Index3 = 1 | 2 | 3

/* ---------- keyframes ---------- */

const waveSlide = keyframes`
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-320px);
  }
`

const unfold2 = keyframes`
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(0, -38px);
  }
`
const unfold3 = keyframes`
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(0, -66px);
  }
`
const unfold4 = keyframes`
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(0, -88px);
  }
`
const pop = keyframes`
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const cast = keyframes`
  0% {
    transform: rotate(35deg);
  }
  6% {
    transform: rotate(-4deg);
  }
  15% {
    transform: rotate(62deg);
  }
  21% {
    transform: rotate(47deg);
  }
  28%,
  57% {
    transform: rotate(50deg);
  }
  62% {
    transform: rotate(59deg);
  }
  66% {
    transform: rotate(52deg);
  }
  70% {
    transform: rotate(58deg);
  }
  78% {
    transform: rotate(50deg);
  }
  90%,
  100% {
    transform: rotate(35deg);
  }
`

const flex = keyframes`
  0%,
  3% {
    transform: rotate(0deg);
  }
  9% {
    transform: rotate(-16deg);
  }
  17% {
    transform: rotate(18deg);
  }
  23% {
    transform: rotate(-5deg);
  }
  29%,
  59% {
    transform: rotate(0deg);
  }
  63% {
    transform: rotate(12deg);
  }
  67% {
    transform: rotate(3deg);
  }
  71% {
    transform: rotate(10deg);
  }
  80%,
  100% {
    transform: rotate(0deg);
  }
`

const lineArc = keyframes`
  0%,
  15% {
    opacity: 0;
    stroke-dashoffset: 100;
  }
  16% {
    opacity: 1;
    stroke-dashoffset: 100;
  }
  42% {
    stroke-dashoffset: 0;
  }
  59% {
    opacity: 1;
    stroke-dashoffset: 0;
  }
  61%,
  100% {
    opacity: 0;
    stroke-dashoffset: 0;
  }
`
const lineTaut = keyframes`
  0%,
  60% {
    opacity: 0;
  }
  62%,
  81% {
    opacity: 1;
  }
  84%,
  100% {
    opacity: 0;
  }
`

const floatFlight = keyframes`
  0%,
  15% {
    transform: translate(124px, 79px);
    opacity: 0;
  }
  16% {
    transform: translate(124px, 79px);
    opacity: 1;
  }
  22% {
    transform: translate(160px, 44px);
  }
  30% {
    transform: translate(200px, 40px);
  }
  36% {
    transform: translate(228px, 82px);
  }
  42% {
    transform: translate(240px, 138px);
  }
  46% {
    transform: translate(240px, 134px);
  }
  50% {
    transform: translate(240px, 139px);
  }
  54% {
    transform: translate(240px, 135px);
  }
  58% {
    transform: translate(240px, 138px);
  }
  62% {
    transform: translate(240px, 153px);
  }
  66% {
    transform: translate(240px, 143px);
  }
  70% {
    transform: translate(240px, 155px);
  }
  76% {
    transform: translate(240px, 150px);
  }
  82% {
    transform: translate(240px, 150px);
    opacity: 1;
  }
  88%,
  100% {
    transform: translate(240px, 162px);
    opacity: 0;
  }
`

const ripple1 = keyframes`
  0%,
  41% {
    transform: scale(0);
    opacity: 0;
  }
  42% {
    transform: scale(0.15);
    opacity: 0.9;
  }
  58% {
    transform: scale(1.5);
    opacity: 0;
  }
  61% {
    transform: scale(0.15);
    opacity: 0.8;
  }
  74%,
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
`
const ripple2 = keyframes`
  0%,
  44% {
    transform: scale(0);
    opacity: 0;
  }
  45% {
    transform: scale(0.15);
    opacity: 0.7;
  }
  61%,
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
`
const ripple3 = keyframes`
  0%,
  47% {
    transform: scale(0);
    opacity: 0;
  }
  48% {
    transform: scale(0.15);
    opacity: 0.5;
  }
  64%,
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
`
const rippleFrames = { 1: ripple1, 2: ripple2, 3: ripple3 } as const

const drop1 = keyframes`
  0%,
  41% {
    opacity: 0;
    transform: translate(0, 0);
  }
  42% {
    opacity: 1;
  }
  49% {
    transform: translate(-10px, -16px);
    opacity: 1;
  }
  55%,
  100% {
    transform: translate(-14px, -2px);
    opacity: 0;
  }
`
const drop2 = keyframes`
  0%,
  41% {
    opacity: 0;
    transform: translate(0, 0);
  }
  42% {
    opacity: 1;
  }
  49% {
    transform: translate(9px, -20px);
    opacity: 1;
  }
  56%,
  100% {
    transform: translate(13px, -2px);
    opacity: 0;
  }
`
const drop3 = keyframes`
  0%,
  41% {
    opacity: 0;
    transform: translate(0, 0);
  }
  42% {
    opacity: 1;
  }
  48% {
    transform: translate(1px, -24px);
    opacity: 1;
  }
  54%,
  100% {
    transform: translate(2px, -2px);
    opacity: 0;
  }
`
const dropFrames = { 1: drop1, 2: drop2, 3: drop3 } as const

const fishBite = keyframes`
  0%,
  52% {
    transform: translate(196px, 200px);
    opacity: 0;
  }
  56% {
    transform: translate(220px, 190px);
    opacity: 0.85;
  }
  60% {
    transform: translate(236px, 164px);
  }
  63% {
    transform: translate(240px, 153px);
  }
  68% {
    transform: translate(242px, 160px);
  }
  72% {
    transform: translate(238px, 156px);
  }
  78% {
    transform: translate(246px, 168px);
    opacity: 0.85;
  }
  86%,
  100% {
    transform: translate(262px, 200px);
    opacity: 0;
  }
`

const bubble1 = keyframes`
  0%,
  62% {
    opacity: 0;
    transform: translateY(0);
  }
  64% {
    opacity: 0.7;
  }
  78%,
  100% {
    opacity: 0;
    transform: translateY(-11px);
  }
`
const bubble2 = keyframes`
  0%,
  66% {
    opacity: 0;
    transform: translateY(0);
  }
  68% {
    opacity: 0.6;
  }
  82%,
  100% {
    opacity: 0;
    transform: translateY(-14px);
  }
`
const bubble3 = keyframes`
  0%,
  70% {
    opacity: 0;
    transform: translateY(0);
  }
  72% {
    opacity: 0.6;
  }
  86%,
  100% {
    opacity: 0;
    transform: translateY(-18px);
  }
`
const bubbleFrames = { 1: bubble1, 2: bubble2, 3: bubble3 } as const

const shimmer = keyframes`
  from {
    background-position: 125% 0;
  }
  to {
    background-position: -125% 0;
  }
`

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

/* Only referenced from the reduced-motion block of Float. */
const bob = keyframes`
  0%,
  100% {
    transform: translate(240px, 138px);
  }
  50% {
    transform: translate(240px, 135px);
  }
`

/* ---------- root + card ---------- */

export const SplashRoot = styled(motion.div)`
  --loop: 3.6s;
  --unfold: 0.9s;
  --ease-spring: cubic-bezier(0.2, 0.9, 0.3, 1.15);
  --rod: var(--fg);
  --rod-2: var(--fg-2);
  --water-1: color-mix(in srgb, var(--accent) 34%, transparent);
  --water-2: color-mix(in srgb, var(--accent) 58%, transparent);
  --water-3: color-mix(in srgb, var(--accent) 18%, transparent);
  position: fixed;
  inset: 0;
  z-index: 50;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 24px 16px;

  /* reduced motion: rod extended, float bobbing, nothing else */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation: none !important;
    }
  }
`

export const SplashCard = styled.div`
  ${glass}
  width: min(92vw, 480px);
  border-radius: var(--radius-lg);
  padding: 22px 32px 28px;
  text-align: center;
  box-sizing: border-box;
`

export const Cast = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  overflow: hidden; /* waves are drawn 2× wide and slide; clip to the scene */
  border-radius: var(--radius-md);
`

/* ---------- water ---------- */

export const WaterTop = styled.stop`
  stop-color: color-mix(in srgb, var(--accent) 30%, transparent);
`
export const WaterBottom = styled.stop`
  stop-color: color-mix(in srgb, var(--accent) 8%, transparent);
`

const wave = css`
  will-change: transform;
`
export const WaveBack = styled.path`
  ${wave}
  fill: var(--water-1);
  animation: ${waveSlide} 7s linear infinite;
`
export const WaveFront = styled.path`
  ${wave}
  fill: var(--water-2);
  animation: ${waveSlide} 4.6s linear infinite reverse;
`

/* ---------- shore + rod ---------- */

export const Shore = styled.ellipse`
  fill: var(--glass-line);
`

export const Rod = styled.g`
  transform-origin: 40px 150px;
  transform: rotate(35deg);
  will-change: transform;
  animation: ${cast} var(--loop) ease-in-out infinite both;
  animation-delay: var(--unfold);

  @media (prefers-reduced-motion: reduce) {
    transform: rotate(50deg);
  }
`

export const Handle = styled.line`
  stroke: var(--rod-2);
  stroke-width: 6;
  stroke-linecap: round;
`
export const Reel = styled.circle`
  fill: var(--rod-2);
`

export const Guide = styled.circle`
  fill: none;
  stroke: var(--accent);
  stroke-width: 1;
  animation: ${pop} 0.25s var(--ease-spring) both;
`

/* telescopic unfold: each segment slides out from the handle once */
export const Seg = styled.g<{ $n: 1 | 2 | 3 | 4 }>`
  line {
    stroke: var(--rod);
    stroke-linecap: round;
  }

  ${(p) =>
    p.$n === 1 &&
    css`
      line {
        stroke-width: 4.2;
      }
      ${Guide} {
        animation-delay: 0.1s;
      }
    `}
  ${(p) =>
    p.$n === 2 &&
    css`
      transform: translate(0, -38px);
      animation: ${unfold2} 0.4s var(--ease-spring) both;
      animation-delay: 0.15s;
      line {
        stroke-width: 3.2;
      }
      ${Guide} {
        animation-delay: 0.45s;
      }
    `}
  ${(p) =>
    p.$n === 3 &&
    css`
      transform: translate(0, -66px);
      animation: ${unfold3} 0.4s var(--ease-spring) both;
      animation-delay: 0.35s;
      line {
        stroke-width: 2.4;
      }
      ${Guide} {
        animation-delay: 0.65s;
      }
    `}
  ${(p) =>
    p.$n === 4 &&
    css`
      transform: translate(0, -88px);
      animation: ${unfold4} 0.4s var(--ease-spring) both;
      animation-delay: 0.55s;
      line {
        stroke-width: 1.7;
      }
      ${Guide} {
        animation-delay: 0.85s;
      }
    `}
`

/* tip flex lags the cast */
export const Tip = styled.g`
  transform-origin: 40px 110px;
  animation: ${flex} var(--loop) ease-in-out infinite both;
  animation-delay: var(--unfold);
`

/* ---------- line ---------- */

const line = css`
  fill: none;
  stroke: var(--fg-2);
  stroke-width: 0.9;
  stroke-linecap: round;
  stroke-dasharray: 100;
  animation-duration: var(--loop);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-delay: var(--unfold);
`
export const LineArc = styled.path`
  ${line}
  animation-name: ${lineArc};

  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    stroke-dashoffset: 0;
  }
`
export const LineTaut = styled.path`
  ${line}
  animation-name: ${lineTaut};

  @media (prefers-reduced-motion: reduce) {
    opacity: 0;
  }
`

/* ---------- float ---------- */

export const Float = styled.g`
  transform: translate(240px, 138px);
  will-change: transform, opacity;
  animation: ${floatFlight} var(--loop) ease-in-out infinite both;
  animation-delay: var(--unfold);

  /* && outranks the root's "* { animation: none !important }" */
  @media (prefers-reduced-motion: reduce) {
    && {
      opacity: 1;
      animation: ${bob} 3s ease-in-out infinite !important;
    }
  }
`
export const FloatStem = styled.line`
  stroke: var(--fg);
  stroke-width: 1;
`
export const FloatBody = styled.ellipse`
  fill: var(--band-slow);
`
export const FloatBelly = styled.path`
  fill: #fff;
`
export const FloatTip = styled.circle`
  fill: var(--band-dead);
`

/* ---------- splash effects ---------- */

export const Ripple = styled.ellipse<{ $n: Index3 }>`
  fill: none;
  stroke: var(--accent);
  stroke-width: 1;
  transform-box: fill-box;
  transform-origin: center;
  animation-duration: var(--loop);
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-delay: var(--unfold);
  animation-name: ${(p) => rippleFrames[p.$n]};

  @media (prefers-reduced-motion: reduce) {
    opacity: 0;
  }
`

export const Drop = styled.circle<{ $n: Index3 }>`
  fill: var(--accent);
  animation-duration: var(--loop);
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-delay: var(--unfold);
  animation-name: ${(p) => dropFrames[p.$n]};

  @media (prefers-reduced-motion: reduce) {
    opacity: 0;
  }
`

/* ---------- fish + bubbles ---------- */

export const Fish = styled.g`
  fill: var(--accent);
  opacity: 0;
  transform: translate(200px, 200px);
  will-change: transform, opacity;
  animation: ${fishBite} var(--loop) ease-in-out infinite both;
  animation-delay: var(--unfold);

  @media (prefers-reduced-motion: reduce) {
    opacity: 0;
  }
`
export const FishEye = styled.circle`
  fill: var(--bg);
`

export const Air = styled.circle<{ $n: Index3 }>`
  fill: var(--accent);
  opacity: 0;
  animation-duration: var(--loop);
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-delay: var(--unfold);
  animation-name: ${(p) => bubbleFrames[p.$n]};

  @media (prefers-reduced-motion: reduce) {
    opacity: 0;
  }
`

/* ---------- text ---------- */

export const SplashBrand = styled.div`
  margin-top: 6px;
  padding: 0 8px; /* room for the clipped gradient so edge glyphs are not cut */
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.1;
  overflow-wrap: anywhere;
  background: linear-gradient(
    90deg,
    var(--fg) 0%,
    var(--accent) 40%,
    var(--fg) 60%,
    var(--fg) 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: ${shimmer} 3.2s linear infinite;
`

export const SplashTagline = styled.div`
  margin-top: 4px;
  padding: 0 8px;
  color: var(--fg-2);
  font-size: 14px;
  line-height: 1.35;
  text-wrap: balance;
`

export const SplashStatus = styled.div`
  margin-top: 16px;
  padding: 0 8px;
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
`
