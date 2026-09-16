import styled from 'styled-components'
import { glass, hideWhileSearching, Panel, PanelFooter, PanelScroll, Tabs, tabular } from '../styles/shared'

/* Launcher ---------------------------------------------------------------- */

/** "Where to go?" pill. Bottom-left on phones, under the header on desktop. */
export const Launcher = styled.button`
  position: fixed;
  z-index: 14;
  left: 12px;
  /* clear the map attribution line */
  bottom: calc(env(safe-area-inset-bottom, 0px) + 48px);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 15px;
  border-radius: 999px;
  ${glass}
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fg);
  white-space: nowrap;
  ${hideWhileSearching}

  @media (min-width: 720px) {
    bottom: auto;
    top: calc(var(--header-h, 72px) + 12px);
    left: 16px;
  }
`

/* Panel ------------------------------------------------------------------- */

/* Same liquid-glass material as the header and the layer rail. */
export const PlannerPanel = styled(Panel)`
  ${glass}
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
  backdrop-filter: blur(28px) saturate(1.8);
  box-shadow:
    0 14px 40px rgba(0, 0, 0, 0.16),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);

  :root[data-theme='dark'] & {
    box-shadow:
      0 14px 40px rgba(0, 0, 0, 0.5),
      0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  }

  left: 12px;
  right: 12px;
  top: calc(var(--header-h, 72px) + 8px);
  bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
  ${hideWhileSearching}

  @media (min-width: 720px) {
    right: auto;
    bottom: auto;
    left: 16px;
    top: calc(var(--header-h, 72px) + 12px);
    width: 384px;
    max-height: calc(100vh - var(--header-h, 72px) - 28px);
  }
`

export const HeadText = styled.div`
  flex: 1;
  min-width: 0;
`

export const DayTabs = styled(Tabs)`
  margin: 0 16px;
  flex: none;
`

/* Filters ----------------------------------------------------------------- */

/* Wraps so every filter stays reachable; nothing scrolls off the edge. */
export const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 12px 16px 6px;
  flex: none;
`


/** Native select dressed as a shared Chip. */

/* List -------------------------------------------------------------------- */

export const List = styled(PanelScroll)`
  padding: 8px;
  -webkit-mask-image: linear-gradient(#000 calc(100% - 18px), transparent);
  mask-image: linear-gradient(#000 calc(100% - 18px), transparent);
`

export const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border-radius: var(--r-row);
  width: 100%;
  text-align: left;
  min-height: 70px;
  color: var(--fg);

  &:hover {
    background: var(--row-hover);
  }
`

export const Rank = styled.span`
  width: 16px;
  flex: none;
  font-size: 12px;
  color: var(--fg-3);
  ${tabular}
`

export const RowText = styled.span`
  flex: 1;
  min-width: 0;
  display: block;
`

export const RowName = styled.span`
  display: block;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const RowMeta = styled.span`
  display: block;
  font-size: 12.5px;
  color: var(--fg-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const RowBest = styled.span`
  display: block;
  font-size: 12.5px;
  color: var(--fg-3);
  ${tabular}

  em {
    font-style: normal;
    font-weight: 600;
    color: var(--accent);
  }
`

export const Chevron = styled.span`
  width: 7px;
  height: 7px;
  flex: none;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
  color: var(--fg-3);
  margin-right: 4px;
`

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
`

/* Footer ------------------------------------------------------------------ */

export const FooterNote = styled.p`
  margin: 0;
  flex: 1;
  font-size: 12.5px;
  color: var(--fg-2);
`

export const LocateBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  border-radius: 11px;
  background: var(--ctl-bg);
  border: 1px solid var(--brd);
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
  flex: none;
  white-space: nowrap;

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

/** Footer on glass: no solid fill, just a hairline. */
export const PlannerFooter = styled(PanelFooter)`
  background: transparent;
`
