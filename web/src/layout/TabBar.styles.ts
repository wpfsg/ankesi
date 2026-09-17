import styled from 'styled-components'
import { glass } from '../styles/shared'

export const TabNav = styled.nav`
  ${glass}
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 16;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  height: calc(var(--tabbar-h, 58px) + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  border-left: 0;
  border-right: 0;
  border-bottom: 0;
  border-radius: 0;

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: var(--fg-3);
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
  }

  a[aria-current='page'] {
    color: var(--accent);
  }

  @media (min-width: 720px) {
    display: none;
  }
`
