import styled, { css } from 'styled-components'
import { hideWhileSearching } from '../styles/shared'

/* Phones: compact strip under the header. Desktop: card bottom-left that
   slides right of the planner when it is open. */
export const Legend = styled.div<{ $shift?: boolean; $hideOnPhone?: boolean }>`
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
    transition: left 220ms var(--spring);
    ${(p) =>
      p.$shift &&
      css`
        left: 416px;
      `}
  }
`

export const LegendTitle = styled.b`
  display: block;
  font-size: 12px;
  font-weight: 650;
  color: var(--fg);
`

export const Ramp = styled.div`
  height: 8px;
  border-radius: 999px;
  margin: 7px 0 4px;
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
