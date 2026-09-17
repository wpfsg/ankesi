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

/** Who is signed in: initial, name, email. */
export const Identity = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

export const Initial = styled.span`
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 17px;
  font-weight: 700;
  color: var(--pri-fg);
  background: linear-gradient(140deg, var(--accent), var(--pri));
  box-shadow: var(--pri-shadow);
`
