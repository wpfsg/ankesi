import styled, { css } from 'styled-components'
import { Link } from 'react-router'
import { glass, liquidGlass, tabular } from './shared'

/* Layout primitives for content routes. The map keeps its own chrome. */

export const PHONE = '@media (max-width: 719.98px)'
export const DESKTOP = '@media (min-width: 720px)'

export const Page = styled.div<{ $narrow?: boolean }>`
  width: 100%;
  max-width: ${(p) => (p.$narrow ? '760px' : '1120px')};
  margin: 0 auto;
  padding: 28px 16px 64px;

  ${DESKTOP} {
    padding: 44px 32px 96px;
  }
`

export const Eyebrow = styled.p`
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 650;
  letter-spacing: 0.02em;
  color: var(--accent);
`

export const H1 = styled.h1`
  margin: 0;
  font-size: clamp(26px, 4.6vw, 40px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.12;
`

export const Lead = styled.p`
  margin: 12px 0 0;
  max-width: 62ch;
  font-size: clamp(15px, 1.6vw, 17.5px);
  line-height: 1.55;
  color: var(--fg-2);
`

export const PageHead = styled.header`
  margin-bottom: 28px;

  ${DESKTOP} {
    margin-bottom: 40px;
  }
`

export const Section = styled.section`
  margin-top: 40px;

  ${DESKTOP} {
    margin-top: 56px;
  }
`

export const H2 = styled.h2`
  margin: 0 0 14px;
  font-size: clamp(20px, 2.6vw, 26px);
  font-weight: 650;
  letter-spacing: -0.015em;
  line-height: 1.2;
`

export const H3 = styled.h3`
  margin: 0 0 8px;
  font-size: 16.5px;
  font-weight: 650;
  line-height: 1.3;
`

/** Body copy: paragraphs and lists with comfortable measure. */
export const Prose = styled.div`
  max-width: 68ch;
  font-size: 15px;
  line-height: 1.65;
  color: var(--fg);

  p {
    margin: 0 0 14px;
  }

  p:last-child {
    margin-bottom: 0;
  }

  ul,
  ol {
    margin: 0 0 14px;
    padding-left: 22px;
  }

  li + li {
    margin-top: 6px;
  }

  a {
    color: var(--accent);
    text-underline-offset: 2px;
  }

  strong {
    font-weight: 650;
  }
`

export const Card = styled.div`
  ${liquidGlass}
  border-radius: var(--radius-md);
  padding: 18px;

  ${DESKTOP} {
    padding: 22px;
  }
`

export const CardGrid = styled.div<{ $min?: number }>`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, ${(p) => p.$min ?? 280}px), 1fr));
`

/** Two-column split that stacks on phones; main + aside. */
export const Split = styled.div`
  display: grid;
  gap: 24px;

  @media (min-width: 960px) {
    grid-template-columns: minmax(0, 1fr) 360px;
    gap: 40px;
    align-items: start;
  }
`

export const Sticky = styled.div`
  @media (min-width: 960px) {
    position: sticky;
    top: calc(var(--header-h, 72px) + 20px);
  }
`

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  border-radius: var(--radius-md);
  font-weight: 650;
  font-size: 15px;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid transparent;
`

/** Primary call to action as a real link. */
export const ButtonLink = styled(Link)`
  ${buttonBase}
  background: var(--pri);
  color: var(--pri-fg);
  box-shadow: var(--pri-shadow);

  &:hover {
    filter: brightness(1.05);
  }
`

const ghost = css`
  ${glass}
  color: var(--fg);
  border-radius: var(--radius-md);

  &:hover {
    background: var(--glass-bg-strong);
  }
`

export const GhostLink = styled(Link)`
  ${buttonBase}
  ${ghost}
`

export const GhostA = styled.a`
  ${buttonBase}
  ${ghost}
`

export const PrimaryButton = styled.button`
  ${buttonBase}
  background: var(--pri);
  color: var(--pri-fg);
  box-shadow: var(--pri-shadow);

  &:hover {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
    filter: none;
  }
`

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
`

/** Inline text link in the accent colour. */
export const TextLink = styled(Link)`
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  text-underline-offset: 2px;

  &:hover {
    text-decoration: underline;
  }
`

export const Muted = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--fg-3);
`

export const Small = styled.small`
  font-size: 12.5px;
  color: var(--fg-3);
`

export const Num = styled.span`
  ${tabular}
`

/** Definition-style key/value rows. */
export const Facts = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 16px;
  font-size: 14px;

  dt {
    color: var(--fg-3);
  }

  dd {
    margin: 0;
    font-weight: 500;
  }
`

export const Pill = styled.span`
  ${glass}
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12.5px;
  color: var(--fg-2);
`

export const PillLink = styled(Link)`
  ${glass}
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 13px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 550;
  text-decoration: none;
  color: var(--fg);

  &:hover {
    background: var(--glass-bg-strong);
    border-color: var(--chip-on-brd);
  }
`

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

/** Glass-styled text control (search, email). */
export const GlassInput = styled.input`
  ${glass}
  width: 100%;
  min-height: 46px;
  padding: 10px 16px;
  border-radius: var(--radius-md);
  font-size: 16px;
  color: var(--fg);
  outline: none;

  &::placeholder {
    color: var(--fg-3);
  }

  &:focus {
    border-color: var(--accent);
  }
`

/** Soft-gate wrapper: blur the children and float an unlock link. */
export const Gate = styled.div`
  position: relative;
  border-radius: var(--r-row);
  overflow: hidden;

  > [data-gated] {
    filter: blur(5px);
    opacity: 0.55;
    pointer-events: none;
    user-select: none;
  }

  > [data-unlock] {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 12px;
    text-align: center;
  }
`
