import styled from 'styled-components'

/* top layer (below the header) */

export const TopLayer = styled.div`
  position: fixed;
  top: calc(var(--header-h, 72px) + 76px);
  left: 12px;
  right: 12px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }

  /* Desktop: centred under the search field, clear of the planner
     launcher (top-left) and both side panels. */
  @media (min-width: 720px) {
    top: calc(var(--header-h, 72px) + 12px);
    left: 50%;
    right: auto;
    width: max-content;
    max-width: min(560px, calc(100vw - 32px));
    transform: translateX(-50%);
    align-items: center;
  }

`

/* top row: trip pill + account */
export const TopRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const Toast = styled.div`
  align-self: flex-start;

  @media (min-width: 720px) {
    align-self: center;
  }
  padding: 8px 14px;
  border-radius: var(--r-row);
  font-size: 13px;
  color: var(--fg-2);
  display: flex;
  gap: 10px;
  align-items: center;
  background: var(--srf);
  border: 1px solid var(--brd);
  box-shadow: var(--sh-ctl);

  button {
    color: var(--accent);
    font-weight: 600;
  }
`
