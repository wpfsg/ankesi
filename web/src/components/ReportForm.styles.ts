import styled from 'styled-components'
import { bandVar } from '../styles/shared'

/** Five-way activity picker; each button carries its band on data-band. */
export const ActivitySeg = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;

  button {
    ${bandVar}
    height: 56px;
    border-radius: var(--radius-sm);
    background: var(--glass-line);
    font-size: 12px;
    font-weight: 600;
    color: var(--fg-2);
    border: 2px solid transparent;

    &[aria-pressed='true'] {
      background: color-mix(in srgb, var(--band) 30%, transparent);
      border-color: var(--band);
      color: var(--fg);
    }
  }
`
