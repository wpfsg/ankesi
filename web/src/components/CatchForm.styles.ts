import styled from 'styled-components'

/** Label wrapping a checkbox. */
export const Switch = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  cursor: pointer;

  input {
    width: 22px;
    height: 22px;
    accent-color: var(--accent);
  }
`

/** Photo preview shown under the file picker. */
export const Preview = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: var(--radius-sm);
`
