import { createGlobalStyle } from 'styled-components'

/** Design tokens, reset and the few rules that must stay global. Everything
 *  else lives next to its component as styled-components. */
export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light dark;

    --bg: #eef2f5;
    --fg: #0f1720;
    /* Secondary text is solid, never low-alpha, so it stays readable on any map. */
    --fg-2: #4a5766;
    --fg-3: #6b7785;

    /* Solid panel surfaces (planner, detail, legend, controls). */
    --srf: rgba(255, 255, 255, 0.96);
    --srf-2: #f4f6f8;
    --brd: rgba(15, 23, 32, 0.09);
    --ctl-bg: #ffffff;
    --ctl-bg-2: #eef1f4;
    --row-hover: #f2f5f7;
    --row-selected: #e9f3ef;
    --sh: 0 10px 34px rgba(15, 23, 32, 0.16);
    --sh-ctl: 0 4px 14px rgba(15, 23, 32, 0.14);
    --r-panel: 18px;
    --r-row: 14px;
    --r-ctl: 12px;

    /* Primary action green and its text; both pass AA on white. */
    --pri: #1f7a4d;
    --pri-fg: #ffffff;
    --pri-shadow: 0 2px 8px rgba(31, 122, 77, 0.35);
    --ring-track: #e3e8ec;
    --best-bg: linear-gradient(135deg, #e6f4ee, #eef7f5);
    --best-brd: #bfe0d4;
    --best-fg: #3b6b57;
    --up-bg: #e3f2e9;
    --up-fg: #1d6b46;
    --down-bg: #fdeee3;
    --down-fg: #a1490f;
    --alert-bg: #fff8ec;
    --alert-brd: #f0d9ad;
    --alert-fg: #6b4a13;
    --chip-on-bg: #e7f4f1;
    --chip-on-brd: #9ad4ca;
    --chip-on-fg: #0b6b60;

    /* Opaque enough that text stays readable over dark imagery. */
    --glass-bg: rgba(255, 255, 255, 0.88);
    --glass-bg-strong: rgba(255, 255, 255, 0.95);
    --glass-border: rgba(255, 255, 255, 0.7);
    --glass-line: rgba(15, 23, 32, 0.08);
    --glass-blur: blur(24px) saturate(160%);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.75);

    --radius-lg: 28px;
    --radius-md: 20px;
    --radius-sm: 14px;

    --accent: #0e8f80;
    --accent-fg: #ffffff;

    /* Score ramp: <40 · 40–54 · 55–69 · 70–79 · 80+ */
    --band-none: #9aa3ad;
    --band-dead: #b4472b;
    --band-slow: #d98324;
    --band-ok: #b99a1f;
    --band-good: #5e9e4a;
    --band-great: #2e7d4f;

    --font-latin: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-georgian: 'Noto Sans Georgian', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

    --spring: cubic-bezier(0.2, 0.9, 0.3, 1.1);

    /* Motion tokens. Every state change — hover, focus, press, current page,
       theme — eases on these rather than snapping. */
    --ease: cubic-bezier(0.4, 0, 0.2, 1);
    --t-fast: 180ms;
    --t: 240ms;
    --t-slow: 320ms;
  }

  /* Theme is set by lib/theme.ts as data-theme on <html>: saved choice, else OS. */
  :root[data-theme='dark'] {
    color-scheme: dark;
    --bg: #0f1115;
    --fg: #f2f5f7;
    --fg-2: #b4bec8;
    --fg-3: #8a96a3;

    --srf: rgba(22, 25, 31, 0.96);
    --srf-2: #1b1f25;
    --brd: rgba(255, 255, 255, 0.1);
    --ctl-bg: #1d2127;
    --ctl-bg-2: #262b32;
    --row-hover: #232830;
    --row-selected: rgba(46, 125, 79, 0.22);
    --sh: 0 10px 34px rgba(0, 0, 0, 0.5);
    --sh-ctl: 0 4px 14px rgba(0, 0, 0, 0.4);

    /* Deep enough that white text passes AA (4.9:1) on the dark theme too. */
    --pri: #1f7f50;
    --pri-fg: #ffffff;
    --pri-shadow: 0 2px 8px rgba(31, 127, 80, 0.4);
    --ring-track: #2a3038;
    --best-bg: linear-gradient(135deg, rgba(46, 125, 79, 0.22), rgba(46, 125, 79, 0.12));
    --best-brd: rgba(46, 125, 79, 0.45);
    --best-fg: #9fd3b7;
    --up-bg: rgba(46, 125, 79, 0.25);
    --up-fg: #8fd1a8;
    --down-bg: rgba(217, 131, 36, 0.2);
    --down-fg: #f0b073;
    --alert-bg: rgba(240, 180, 80, 0.12);
    --alert-brd: rgba(240, 180, 80, 0.35);
    --alert-fg: #f0cf8a;
    --chip-on-bg: rgba(14, 143, 128, 0.22);
    --chip-on-brd: rgba(14, 143, 128, 0.5);
    --chip-on-fg: #7fd6c9;

    --glass-bg: rgba(20, 22, 28, 0.86);
    --glass-bg-strong: rgba(20, 22, 28, 0.95);
    --glass-border: rgba(255, 255, 255, 0.1);
    --glass-line: rgba(255, 255, 255, 0.08);
    --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
    --glass-highlight: inset 0 1px 0 rgba(255, 255, 255, 0.08);

    --accent: #2fb3a2;
    --accent-fg: #06201d;
    --band-none: #6b7480;
    --band-dead: #d25a3c;
    --band-slow: #e8943a;
    --band-ok: #c9a82c;
    --band-good: #6fb35a;
    --band-great: #3c9463;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    min-height: 100%;
  }

  #root {
    min-height: 100%;
  }

  /* On phones a tab bar takes --tabbar-h at the bottom of every route. The
     map is a fixed, full-screen surface where nothing scrolls behind it;
     content routes scroll normally. App.tsx sets data-app on <html>. */
  :root {
    --tabbar-h: 0px;
  }

  :root[data-app='map'],
  :root[data-app='map'] body,
  :root[data-app='map'] #root {
    height: 100%;
    overflow: hidden;
    overscroll-behavior: none;
  }

  @media (max-width: 719.98px) {
    :root {
      --tabbar-h: 58px;
    }
  }

  body {
    background: var(--bg);
    color: var(--fg);
    /* the theme flip fades instead of cutting */
    transition:
      background-color var(--t-slow) var(--ease),
      color var(--t-slow) var(--ease);
    font-family: var(--font-latin);
    font-size: 14px;
    line-height: 1.45;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }

  h1,
  h2,
  h3,
  h4 {
    text-wrap: balance;
  }

  html[lang='ka'] body {
    font-family: var(--font-georgian);
  }

  button,
  input {
    font: inherit;
    color: inherit;
  }

  button {
    cursor: pointer;
    background: none;
    border: 0;
    padding: 0;
  }

  /* Anything interactive eases between its states. Components that need a
     different curve, or extra properties, declare their own transition — a
     styled class outranks these element selectors and replaces it wholesale. */
  a,
  button,
  input,
  select,
  textarea,
  summary,
  label,
  [role='button'],
  [role='tab'],
  [role='switch'],
  [role='option'] {
    transition:
      color var(--t-fast) var(--ease),
      background-color var(--t-fast) var(--ease),
      border-color var(--t-fast) var(--ease),
      box-shadow var(--t-fast) var(--ease),
      opacity var(--t-fast) var(--ease),
      filter var(--t-fast) var(--ease),
      transform var(--t-fast) var(--ease);
  }

  /* Icons follow the colour of the control they sit in. */
  svg {
    transition:
      color var(--t-fast) var(--ease),
      fill var(--t-fast) var(--ease),
      stroke var(--t-fast) var(--ease);
  }

  button:focus-visible,
  a:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  summary:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* A theme flip repaints every surface at once, so for the length of the
     fade each one eases to its new colour. lib/theme.ts drops the flag as
     soon as the fade is over, so nothing else pays for the blanket rule. */
  @media (prefers-reduced-motion: no-preference) {
    :root[data-theme-shift] *,
    :root[data-theme-shift] *::before,
    :root[data-theme-shift] *::after {
      transition:
        background-color var(--t-slow) var(--ease),
        border-color var(--t-slow) var(--ease),
        color var(--t-slow) var(--ease),
        fill var(--t-slow) var(--ease),
        stroke var(--t-slow) var(--ease),
        box-shadow var(--t-slow) var(--ease) !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition: none !important;
      animation: none !important;
    }
  }
`
