import styled, { css } from 'styled-components'
import { bandVar, tabular } from '../styles/shared'

export const Strip = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 62px;
`

/** One hour bar; band comes from data-band. */
export const Bar = styled.div<{ $now?: boolean }>`
  ${bandVar}
  flex: 1;
  min-height: 3px;
  border-radius: 2px 2px 0 0;
  background: var(--band);
  opacity: 0.85;

  ${(p) =>
    p.$now &&
    css`
      opacity: 1;
      outline: 2px solid var(--fg);
      outline-offset: -2px;
    `}
`

/** Dashed band over the hours of the best window. */
export const Highlight = styled.div`
  position: absolute;
  top: -4px;
  bottom: -4px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--pri) 10%, transparent);
  border: 1px dashed color-mix(in srgb, var(--pri) 45%, transparent);
  pointer-events: none;
`

export const Axis = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 11px;
  color: var(--fg-3);
  ${tabular}
`
