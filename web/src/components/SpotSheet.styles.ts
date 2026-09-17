import styled, { css } from 'styled-components'
import { motion } from 'framer-motion'
import { Muted, Panel, PanelFooter, PanelScroll, PrimaryBtn } from '../styles/shared'

const PHONE = '@media (max-width: 719.98px)'

/* Shells ------------------------------------------------------------------ */

/** Desktop: a fixed panel under the header on the right. */
export const DesktopPanel = styled(Panel)`
  right: 16px;
  top: calc(var(--header-h, 72px) + 12px);
  width: 384px;
  max-height: calc(100vh - var(--header-h, 72px) - 28px);
  z-index: 20;
`

/** Phone: bottom sheet anchored to the top and translated by
 *  y = vh - snapHeight, so the visible height equals the snap height. */
export const Sheet = styled(motion.section)`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: var(--srf);
  border: 1px solid var(--brd);
  border-bottom: 0;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -10px 40px rgba(15, 23, 32, 0.22);
  touch-action: none;
`

export const Handle = styled.div`
  flex: none;
  padding: 0 0 4px;
  cursor: grab;
  touch-action: none;

  &::before {
    content: '';
    display: block;
    width: 38px;
    height: 4px;
    margin: 9px auto 0;
    border-radius: 99px;
    background: var(--fg-3);
    opacity: 0.5;
  }
`

/** The one scrolling region. On phones scrolling is gated by data-scroll
 *  so drags on a collapsed sheet move the sheet, not its content. */
export const Body = styled(PanelScroll)`
  padding: 0 16px 14px;
  touch-action: pan-y;

  &[data-scroll='false'] {
    overflow-y: hidden;
  }
`

/** Title + subtitle column in the head, so the close button can sit at the end. */
export const HeadText = styled.div`
  flex: 1;
  min-width: 0;
`

export const InfoOnly = styled.div`
  margin-bottom: 10px;
`

/* Cards ------------------------------------------------------------------- */

export const SummaryBox = styled.div`
  margin-top: 10px;
  padding: 11px 13px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg);
  background: var(--srf-2);
  border: 1px solid var(--brd);
  border-radius: var(--r-row);
`

export const H4 = styled.h4`
  margin: 16px 0 8px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--fg-2);
`

/* Disclosures ------------------------------------------------------------- */

export const Disclosure = styled.details`
  margin-top: 12px;
  border: 1px solid var(--brd);
  border-radius: var(--r-row);
  background: var(--ctl-bg);

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 13px;
    font-size: 13.5px;
    font-weight: 600;
    list-style: none;
    cursor: pointer;
    border-radius: var(--r-row);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '';
    width: 7px;
    height: 7px;
    flex: none;
    margin-right: 3px;
    border-right: 2px solid var(--fg-2);
    border-bottom: 2px solid var(--fg-2);
    transform: rotate(45deg);
    transition: transform 160ms var(--spring);
  }

  &[open] summary::after {
    transform: rotate(-135deg);
  }
`

export const TextBtn = styled.button`
  display: block;
  padding: 0 13px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--accent);
  text-align: left;
`

export const DisclosureBody = styled.div`
  padding: 0 13px 12px;
`

/* Community --------------------------------------------------------------- */

export const ReportItem = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--brd);

  &:last-child {
    border-bottom: 0;
  }
`

export const ReportBody = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 13.5px;
`

export const ReportMeta = styled.div`
  font-size: 12px;
  color: var(--fg-3);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  button {
    color: var(--fg-3);
  }

  button:disabled {
    cursor: default;
    opacity: 0.7;
  }
`

/* Species / text ---------------------------------------------------------- */

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`

export const Tag = styled.span<{ $protected?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  font-size: 12.5px;
  background: var(--ctl-bg-2);

  ${(p) =>
    p.$protected &&
    css`
      background: color-mix(in srgb, var(--band-dead) 18%, transparent);
      color: var(--band-dead);
    `}
`

export const Para = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--fg-2);
`

export const Alert = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
  padding: 11px 12px;
  border-radius: var(--r-row);
  background: var(--alert-bg);
  border: 1px solid var(--alert-brd);
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--alert-fg);

  svg {
    flex: none;
    margin-top: 1px;
  }
`

/* Advanced ---------------------------------------------------------------- */

export const Field = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  input {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 14px;
    border-radius: var(--r-ctl);
    border: 1px solid var(--brd);
    background: var(--ctl-bg-2);
    font-size: 16px;
    outline: none;
    font-variant-numeric: tabular-nums;
  }

  input:focus {
    border-color: var(--accent);
  }
`

/* Action bar -------------------------------------------------------------- */

export const CopiedNote = styled(Muted)`
  flex: none;
  padding: 0 16px 6px;
  font-size: 12px;
`

export const ActionBar = styled(PanelFooter)`
  gap: 8px;
  background: var(--srf);

  ${PHONE} {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px);
  }
`

export const NavBtn = styled(PrimaryBtn)`
  flex: 1;
  min-width: 0;
  text-decoration: none;
`
