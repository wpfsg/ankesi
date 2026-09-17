import styled from "styled-components";

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
    /* A colour-only change is easy to miss if it snaps, so the link fades a
       touch slower than the global default. */
    transition:
      color var(--t) var(--ease),
      background-color var(--t) var(--ease);
  }

  a:hover {
    color: var(--fg);
  }

  /* The current page reads as current through its colour and weight alone —
     a filled pill on top of the glass bar is one layer too many. */
  a[aria-current="page"],
  a[aria-current="page"]:hover {
    color: var(--fg);
    background: none;
    font-weight: 650;
  }
`;

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

  a[aria-current="true"] {
    background: var(--ctl-bg);
    color: var(--fg);
    box-shadow: 0 1px 3px rgba(15, 23, 32, 0.14);
  }
`;
