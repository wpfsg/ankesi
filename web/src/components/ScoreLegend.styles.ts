import styled, { css } from 'styled-components'
import { hideWhileSearching, bandVar, tabular } from '../styles/shared'

/* Phones: compact strip under the header. Desktop: card bottom-left.
   Hidden entirely while the trip planner is open. */
export const Legend = styled.div<{ $hidden?: boolean; $hideOnPhone?: boolean }>`
  position: fixed;
  z-index: 13;
  left: 12px;
  right: 12px;
  top: calc(var(--header-h, 72px) + 8px);
  padding: 8px 12px;
  background: var(--srf);
  border: 1px solid var(--brd);
  border-radius: var(--r-row);
  box-shadow: var(--sh-ctl);
  ${hideWhileSearching}
  ${(p) =>
    p.$hidden &&
    css`
      display: none;
    `}
  ${(p) =>
    p.$hideOnPhone &&
    css`
      @media (max-width: 719.98px) {
        display: none;
      }
    `}

  @media (min-width: 720px) {
    top: auto;
    right: auto;
    left: 16px;
    bottom: 16px;
    min-width: 300px;
    padding: 10px 12px;
  }
`

export const LegendTitle = styled.b`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  font-weight: 650;
  color: var(--fg);
`

/** Selected spot's score, shown next to the title in its band colour. */
export const LegendScore = styled.span`
  ${bandVar}
  ${tabular}
  font-weight: 700;
  color: var(--band);
`

/* Leaves room above the ramp for the pointer. */
export const RampWrap = styled.div`
  position: relative;
  margin: 10px 0 4px;
`

/** Downward arrow above the ramp marking the selected spot's score. */
export const RampPointer = styled.span`
  position: absolute;
  top: -7px;
  left: var(--pct, 0%);
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--fg);
  transition: left 260ms var(--spring);
  pointer-events: none;

  /* thin tick down through the ramp so the position is exact */
  &::after {
    content: '';
    position: absolute;
    left: -1px;
    top: 0;
    width: 2px;
    height: 9px;
    background: var(--fg);
  }
`

export const Ramp = styled.div`
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--band-dead),
    var(--band-slow),
    var(--band-ok),
    var(--band-good),
    var(--band-great)
  );
`

export const RampLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--fg-2);
`
