import styled, { css } from 'styled-components'
import { Chip, thinScrollbar } from '../styles/shared'

/** The chip that opens the menu; shows the selected value. */
export const Trigger = styled(Chip)`
  padding-right: 9px;
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  svg {
    flex: none;
    transition:
      transform var(--t) var(--spring),
      color var(--t-fast) var(--ease);
  }

  &[aria-expanded='true'] svg {
    transform: rotate(180deg);
  }
`

/* iOS-style liquid glass menu: heavy blur, bright top edge, soft shadow.
   Rendered in a portal and positioned fixed, so panel overflow can't clip it. */
export const Menu = styled.div`
  position: fixed;
  z-index: 60;
  min-width: 200px;
  /* The menu itself never scrolls; MenuList does, inset by this padding so
     the scrollbar stays inside the rounded corners. */
  overflow: hidden;
  padding: 6px;
  border-radius: 18px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
  backdrop-filter: blur(28px) saturate(1.8);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 14px 40px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);
  transform-origin: top left;
  animation: pop 160ms var(--spring);

  :root[data-theme='dark'] & {
    box-shadow:
      0 14px 40px rgba(0, 0, 0, 0.55),
      0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
`

export const Option = styled.button<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13.5px;
  text-align: left;
  color: var(--fg);

  &:hover,
  &[data-active='true'] {
    background: var(--glass-line);
  }

  ${(p) =>
    p.$selected &&
    css`
      font-weight: 600;
      color: var(--chip-on-fg);
    `}

  svg {
    margin-left: auto;
    flex: none;
    opacity: ${(p) => (p.$selected ? 1 : 0)};
  }
`

export const MenuList = styled.div`
  max-height: min(308px, calc(60vh - 12px));
  overflow-y: auto;
  padding-right: 2px;
  ${thinScrollbar}

  &::-webkit-scrollbar-track {
    margin: 10px 0;
  }
`
