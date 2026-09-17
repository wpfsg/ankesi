import styled from 'styled-components'

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;

  a {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 550;
    color: var(--fg-2);
    text-decoration: none;
    white-space: nowrap;
  }

  a:hover {
    color: var(--fg);
    background: var(--row-hover);
  }

  a[aria-current='page'] {
    color: var(--fg);
    background: var(--ctl-bg-2);
    font-weight: 650;
  }
`

export const LangLinks = styled.div`
  display: flex;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--brd);
  background: var(--ctl-bg-2);

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 30px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--fg-2);
    text-decoration: none;
  }

  a[aria-current='true'] {
    background: var(--ctl-bg);
    color: var(--fg);
    box-shadow: 0 1px 3px rgba(15, 23, 32, 0.14);
  }
`
