import styled from 'styled-components'

/** "or" separator between the sign-in options. */
export const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--fg-3);
  font-size: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--glass-line);
  }
`

/** Display-name field with its save button on one line. */
export const NameRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;

  input {
    flex: 1;
    min-width: 0;
  }
`

/** Status chips on a pond submission. */
export const ChipRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  flex: none;
`
