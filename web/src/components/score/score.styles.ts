import styled, { css } from 'styled-components'
import { bandVar } from '../../styles/shared'

const PHONE = '@media (max-width: 719.98px)'

/* Shared by the map panel and the spot pages: one source of truth for how a
   score, its band and the best window look. */

export const Hero = styled.div<{ $size?: 'panel' | 'page' }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 2px 0 12px;

  ${(p) =>
    p.$size === 'page' &&
    css`
      gap: 20px;
      padding: 0;
    `}
`

/** Conic score ring; band from data-band, fill from --pct inline. */
export const ScoreRing = styled.div<{ $size?: 'panel' | 'page' }>`
  ${bandVar}
  --pct: 0%;
  --ring: 76px;
  position: relative;
  width: var(--ring);
  height: var(--ring);
  flex: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(var(--band) 0 var(--pct), var(--ring-track) var(--pct));

  &::after {
    content: '';
    position: absolute;
    inset: 7px;
    border-radius: 50%;
    background: var(--srf);
  }

  ${PHONE} {
    --ring: 64px;
  }

  ${(p) =>
    p.$size === 'page' &&
    css`
      --ring: 104px;
      &::after {
        inset: 9px;
      }
      ${PHONE} {
        --ring: 88px;
      }
    `}
`

export const RingValue = styled.span<{ $size?: 'panel' | 'page' }>`
  position: relative;
  z-index: 2;
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
  color: var(--band);
  font-variant-numeric: tabular-nums;

  ${PHONE} {
    font-size: 21px;
  }

  ${(p) =>
    p.$size === 'page' &&
    css`
      font-size: 36px;
      ${PHONE} {
        font-size: 30px;
      }
    `}
`

export const HeroMeta = styled.div`
  ${bandVar}
  flex: 1;
  min-width: 0;
`

export const BandLabel = styled.h3<{ $size?: 'panel' | 'page' }>`
  margin: 0;
  font-size: 19px;
  font-weight: 650;
  line-height: 1.1;
  color: var(--band);

  ${(p) =>
    p.$size === 'page' &&
    css`
      font-size: 24px;
    `}
`

export const BandSummary = styled.p`
  margin: 3px 0 0;
  font-size: 13px;
  color: var(--fg-2);
`

export const ConfChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--fg-2);
  background: var(--ctl-bg-2);
`

export const BestCard = styled.div`
  margin-top: 10px;
  padding: 12px 13px;
  border-radius: var(--r-row);
  border: 1px solid var(--best-brd);
  background: var(--best-bg);

  small {
    display: block;
    font-size: 11.5px;
    font-weight: 600;
    color: var(--best-fg);
  }

  b {
    display: block;
    margin-top: 2px;
    font-size: 18px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }

  i {
    display: block;
    font-style: normal;
    font-size: 12.5px;
    color: var(--best-fg);
  }
`

export const ImpactList = styled.div`
  padding: 0 13px 10px;
  display: flex;
  flex-direction: column;
  gap: 9px;
`

export const ImpactRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`

export const ImpactIcon = styled.span<{ $tone: 'up' | 'down' | 'flat' }>`
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  background: var(--ctl-bg-2);
  color: var(--fg-3);

  ${(p) =>
    p.$tone === 'up' &&
    css`
      background: var(--up-bg);
      color: var(--up-fg);
    `}
  ${(p) =>
    p.$tone === 'down' &&
    css`
      background: var(--down-bg);
      color: var(--down-fg);
    `}
`

export const ImpactText = styled.div`
  flex: 1;
  min-width: 0;

  b {
    display: block;
    font-size: 13px;
    font-weight: 600;
  }

  span {
    display: block;
    font-size: 12.5px;
    line-height: 1.35;
    color: var(--fg-2);
  }
`
