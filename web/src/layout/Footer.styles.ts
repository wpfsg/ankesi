import styled from 'styled-components'
import { liquidGlass } from '../styles/shared'

export const FooterRoot = styled.footer`
  ${liquidGlass}
  margin: 40px 12px calc(env(safe-area-inset-bottom, 0px) + var(--tabbar-h, 0px) + 12px);
  border-radius: var(--radius-lg);
  padding-bottom: 24px;

  @media (min-width: 720px) {
    margin-left: 16px;
    margin-right: 16px;
  }
`

export const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 36px 16px 0;

  @media (min-width: 720px) {
    padding: 48px 28px 0;
  }
`

export const Cols = styled.div`
  display: grid;
  gap: 28px 20px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (min-width: 720px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 32px;
  }
`

export const Col = styled.div`
  h2 {
    margin: 0 0 12px;
    font-size: 12.5px;
    font-weight: 650;
    letter-spacing: 0.02em;
    color: var(--fg-3);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  a {
    color: var(--fg-2);
    font-size: 14px;
    text-decoration: none;
  }

  a:hover {
    color: var(--fg);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`

export const Bottom = styled.div`
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--brd);
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 720px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }
`

export const Tagline = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  color: var(--fg-2);

  b {
    color: var(--fg);
  }
`

export const Attribution = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: var(--fg-3);
  max-width: 62ch;

  @media (min-width: 720px) {
    text-align: right;
  }
`
