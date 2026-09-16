import styled, { css } from 'styled-components'

/* Mixins ------------------------------------------------------------------ */

/** Frosted glass material used by every floating surface. */
export const glass = css`
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), var(--glass-highlight);

  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    background: var(--glass-bg-strong);
  }
`

export const tabular = css`
  font-variant-numeric: tabular-nums;
`

/** Inline number with tabular figures; use `as="strong"` etc. as needed. */
export const Tabular = styled.span`
  ${tabular}
`

/** Resolves the score band on a data-band attribute into --band. */
export const bandVar = css`
  --band: var(--band-none);

  &[data-band='dead'] {
    --band: var(--band-dead);
  }
  &[data-band='slow'] {
    --band: var(--band-slow);
  }
  &[data-band='ok'] {
    --band: var(--band-ok);
  }
  &[data-band='good'] {
    --band: var(--band-good);
  }
  &[data-band='great'] {
    --band: var(--band-great);
  }
`

/** Fades a fixed element out while the header search results are open.
 *  Header sets data-searching on <html>. */
export const hideWhileSearching = css`
  html[data-searching='true'] & {
    opacity: 0;
    pointer-events: none;
    transition: opacity 120ms;
  }
`

/** Thin, rounded overlay scrollbar that floats inside rounded surfaces. */
export const thinScrollbar = css`
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--fg) 28%, transparent) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
    margin: 6px 0;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg) 28%, transparent);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--fg) 45%, transparent);
  }
`

/* Surfaces ---------------------------------------------------------------- */

export const Glass = styled.div`
  ${glass}
`

/* Text -------------------------------------------------------------------- */

export const Muted = styled.div`
  color: var(--fg-2);
  font-size: 13px;
`

/** Small section heading inside sheets and modals. */
export const SectionHeading = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--fg-2);
  margin: 20px 0 8px;
`

export const Badge = styled.span<{ $tone?: 'warn' | 'accent' }>`
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  padding: 4px 7px;
  border-radius: 7px;
  background: var(--ctl-bg-2);
  color: var(--fg-2);
  vertical-align: middle;

  ${(p) =>
    p.$tone === 'warn' &&
    css`
      background: color-mix(in srgb, var(--band-dead) 22%, transparent);
      color: var(--band-dead);
    `}
  ${(p) =>
    p.$tone === 'accent' &&
    css`
      background: color-mix(in srgb, var(--accent) 22%, transparent);
      color: var(--accent);
    `}
`

export const Notice = styled.div<{ $warn?: boolean }>`
  padding: 12px 14px;
  border-radius: var(--r-row);
  background: var(--srf-2);
  border: 1px solid var(--brd);
  font-size: 13px;
  color: var(--fg-2);

  ${(p) =>
    p.$warn &&
    css`
      background: color-mix(in srgb, var(--band-dead) 14%, transparent);
      color: var(--band-dead);
    `}
`

/* Buttons ----------------------------------------------------------------- */

export const Btn = styled.button<{ $accent?: boolean; $block?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 18px;
  border-radius: var(--radius-md);
  font-weight: 600;
  background: var(--glass-line);

  ${(p) =>
    p.$accent &&
    css`
      background: var(--accent);
      color: var(--accent-fg);
    `}
  ${(p) =>
    p.$block &&
    css`
      width: 100%;
    `}
`

export const IconBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--glass-line);
  color: var(--fg-2);
  flex: none;
`

/** Score bubble used in lists; band comes from data-band. */
export const MiniBubble = styled.span`
  ${bandVar}
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
  ${tabular}
  background: color-mix(in srgb, var(--band) 38%, transparent);
  border: 2px solid var(--band);
  flex: none;
`

/* Forms ------------------------------------------------------------------- */

export const Label = styled.label`
  display: block;
  font-size: 12px;
  color: var(--fg-2);
  margin-bottom: 4px;
`

const control = css`
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-line);
  background: var(--glass-line);
  font-size: 16px;
  outline: none;
  color: var(--fg);

  &:focus {
    border-color: var(--accent);
  }
`

export const Input = styled.input`
  ${control}
`

export const Textarea = styled.textarea`
  ${control}
  resize: vertical;
  min-height: 72px;
`

export const Select = styled.select`
  ${control}
  appearance: none;
  -webkit-appearance: none;
`

export const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`

/** Label wrapping a hidden file input. */
export const FileBtn = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  background: var(--glass-line);
  cursor: pointer;
  font-size: 14px;

  input {
    display: none;
  }
`

/* Lists ------------------------------------------------------------------- */

export const Thumb = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  flex: none;
  background: var(--glass-line);
`

export const CatchItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--glass-line);

  &:last-child {
    border-bottom: 0;
  }
`

export const CatchBody = styled.div`
  flex: 1;
  min-width: 0;

  small {
    display: block;
    color: var(--fg-2);
    font-size: 12px;
  }
`

/* Panels ------------------------------------------------------------------ */

/** Floating panel shell: flex column with exactly one scrolling child.
 *  Never give it a fixed height; cap it with max-height. */
export const Panel = styled.section`
  position: fixed;
  z-index: 15;
  display: flex;
  flex-direction: column;
  background: var(--srf);
  -webkit-backdrop-filter: blur(20px);
  backdrop-filter: blur(20px);
  border: 1px solid var(--brd);
  border-radius: var(--r-panel);
  box-shadow: var(--sh);
  overflow: hidden;
`

export const PanelHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 16px 12px;
  flex: none;
`

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: 16.5px;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.2;
`

export const PanelSub = styled.p`
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--fg-3);
`

/** Square close button that sits at the end of a panel head. */
export const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: var(--ctl-bg-2);
  color: var(--fg-2);
  margin-left: auto;
  flex: 0 0 auto;

  &:hover {
    color: var(--fg);
  }
`

/** The one scrolling region inside a Panel. */
export const PanelScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  ${thinScrollbar}
`

/** Bottom bar pinned under the scroll region. */
export const PanelFooter = styled.div`
  flex: none;
  padding: 10px 12px;
  border-top: 1px solid var(--brd);
  background: var(--srf-2);
  display: flex;
  align-items: center;
  gap: 10px;
`

/** Pill-shaped tab strip; children are buttons with aria-selected. */
export const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: var(--ctl-bg-2);
  border-radius: var(--r-ctl);
  padding: 4px;

  button {
    flex: 1;
    height: 34px;
    border-radius: 9px;
    font-size: 13.5px;
    font-weight: 600;
    color: var(--fg-2);
  }

  button[aria-selected='true'],
  button[aria-pressed='true'] {
    background: var(--ctl-bg);
    color: var(--fg);
    box-shadow: 0 1px 3px rgba(15, 23, 32, 0.14);
  }
`

/** Filter chip; $on marks an active filter. */
export const Chip = styled.button<{ $on?: boolean }>`
  flex: 0 0 auto;
  height: 31px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--brd);
  background: var(--ctl-bg);
  font-size: 12.5px;
  color: var(--fg-2);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;

  ${(p) =>
    p.$on &&
    css`
      background: var(--chip-on-bg);
      border-color: var(--chip-on-brd);
      color: var(--chip-on-fg);
      font-weight: 600;
    `}
`

/** Solid score tile: band colour behind white digits. */
export const ScoreSquare = styled.span`
  ${bandVar}
  width: 42px;
  height: 42px;
  border-radius: var(--r-row);
  display: grid;
  place-items: center;
  background: var(--band);
  color: #fff;
  font-weight: 700;
  font-size: 15.5px;
  ${tabular}
  flex: 0 0 auto;
  box-shadow: 0 2px 6px rgba(15, 23, 32, 0.18);
`

/** Primary call-to-action (solid green). */
export const PrimaryBtn = styled.button`
  height: 44px;
  padding: 0 16px;
  border-radius: 13px;
  background: var(--pri);
  color: var(--pri-fg);
  font-weight: 650;
  font-size: 14.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: var(--pri-shadow);

  &:hover {
    filter: brightness(1.05);
  }
`

/** Square secondary action next to a PrimaryBtn. */
export const SquareBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 13px;
  border: 1px solid var(--brd);
  background: var(--ctl-bg);
  color: var(--fg-2);
  display: grid;
  place-items: center;
  flex: 0 0 auto;

  &:hover {
    color: var(--fg);
  }

  &[aria-pressed='true'] {
    background: var(--chip-on-bg);
    border-color: var(--chip-on-brd);
    color: var(--chip-on-fg);
  }
`

/** Small bordered control button used for map chrome. */
export const CtlBtn = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: var(--ctl-bg);
  color: var(--fg-2);
  display: grid;
  place-items: center;
  box-shadow: var(--sh-ctl);
  border: 1px solid var(--brd);

  &:hover {
    color: var(--fg);
  }
`
