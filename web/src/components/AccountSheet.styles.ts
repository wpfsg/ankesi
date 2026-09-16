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
