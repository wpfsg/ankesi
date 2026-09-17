import styled, { css, keyframes } from "styled-components";
import { glass, liquidGlass, tabular, thinScrollbar } from "../styles/shared";

export const HeaderRoot = styled.header`
  ${glass}
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 12;
  padding: calc(env(safe-area-inset-top, 0px) + 10px) 14px 10px;
  border-top: 0;
  border-left: 0;
  border-right: 0;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);

  @media (min-width: 720px) {
    padding-left: 40px;
    padding-right: 40px;
  }
`;

/* Phones: brand · search (fills) · actions, in one flex row. */
export const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  /* Wider screens: three columns so the search field sits in the exact
     centre while the brand hugs the left edge and the actions the right. */
  @media (min-width: 720px) {
    display: grid;
    /* the middle column narrows on tablets so both side columns can stay
       equal and the field remains centred */
    grid-template-columns:
      minmax(max-content, 1fr) minmax(0, clamp(220px, 36vw, 560px))
      minmax(max-content, 1fr);
    gap: 14px;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  margin-left: auto;

  @media (min-width: 720px) {
    justify-self: end;
    gap: 12px;
    margin-left: 0;
  }
`;

/* Brand plus, on wide screens, the primary links in one grid column. */
export const BrandCol = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: none;

  @media (min-width: 720px) {
    justify-self: start;
  }
`;

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  font-weight: 700;
  font-size: 17px;
  color: var(--fg);
  text-decoration: none;
`;

export const NavSlot = styled.nav`
  display: none;

  @media (min-width: 1100px) {
    display: block;
    margin-left: 8px;
  }
`;

export const BrandName = styled.span`
  display: none;

  @media (min-width: 480px) {
    display: inline;
  }
`;

export const Search = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  background: var(--glass-line);

  @media (min-width: 720px) {
    width: 100%;
  }

  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    outline: none;
    font-size: 16px;
    padding: 0;
  }

  input::placeholder {
    color: var(--fg-3);
  }
`;

export const PillIcon = styled.svg`
  width: 18px;
  height: 18px;
  color: var(--fg-2);
  flex: none;
`;

export const IconToggle = styled.button`
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: var(--r-ctl);
  display: grid;
  place-items: center;
  border: 1px solid var(--brd);
  background: var(--ctl-bg);
  color: var(--fg-2);

  &:hover {
    color: var(--fg);
  }
`;

export const LangChip = styled.div`
  display: flex;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid var(--brd);
  background: var(--ctl-bg-2);

  button {
    min-width: 40px;
    height: 30px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: var(--fg-2);
  }

  button[aria-pressed="true"] {
    background: var(--ctl-bg);
    color: var(--fg);
    box-shadow: 0 1px 3px rgba(15, 23, 32, 0.14);
  }
`;

export const Avatar = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--pri);
  color: var(--pri-fg);
  font-size: 12px;
  font-weight: 700;
`;

/* Secondary on purpose: the header has one primary action, Premium. On
   phones the tab bar carries Account, so the whole control is hidden there. */
export const AccountWrap = styled.div`
  display: none;

  @media (min-width: 720px) {
    display: block;
    position: relative;
    flex: none;
  }
`;

export const AccountBtn = styled.button`
  display: none;

  @media (min-width: 720px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 38px;
    min-width: 38px;
    padding: 0 14px;
    flex: none;
    border-radius: 999px;
    border: 1px solid var(--brd);
    background: var(--ctl-bg);
    color: var(--fg-2);
    font-weight: 600;
    font-size: 14px;

    &:hover {
      color: var(--fg);
    }
  }
`;

export const AccountLabel = styled.span`
  display: none;

  @media (min-width: 720px) {
    display: inline;
  }
`;

const dropIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
`;

/* Same entrance for the desktop panel, which is centred with a transform. */
const dropInCentred = keyframes`
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px);
  }
`;

/** The search dropdown: a glass panel under the field. The list inside is
 *  capped at five rows; everything below that scrolls. */
export const HeaderResults = styled.div`
  --row-h: 52px;
  /* Fixed, and a sibling of the header rather than a child: inside an element
     that already has a backdrop-filter, this one would only ever blur the
     header, not the page showing through underneath. */
  position: fixed;
  /* max() so a stale 0 from the header's own measurement can never park the
     panel on top of the bar. */
  top: calc(max(var(--header-h, 64px), 56px) + 6px);
  left: 12px;
  right: 12px;
  z-index: 13;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  /* Same tone as the header bar it hangs from, blurred a little harder. */
  ${liquidGlass}
  transform-origin: top center;
  animation: ${dropIn} 160ms var(--spring);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }

  @media (min-width: 720px) {
    /* sit directly under the centred search field */
    left: 50%;
    right: auto;
    width: min(560px, 36vw, calc(100% - 40px));
    transform: translateX(-50%);
    animation-name: ${dropInCentred};
  }
`;

/** What the list below is: "All spots" or the number of matches. */
export const ResultsHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 8px;
  font-size: 11.5px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--fg-3);

  span {
    ${tabular}
    letter-spacing: 0;
    text-transform: none;
    font-weight: 600;
  }
`;

export const ResultsList = styled.div`
  padding: 0 6px 6px;
  max-height: min(calc(var(--row-h) * 5 + 6px), 50vh);
  overflow-y: auto;
  overscroll-behavior: contain;
  ${thinScrollbar}
`;

export const Result = styled.button<{ $muted?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: var(--row-h);
  text-align: left;
  padding: 0 10px;
  border-radius: var(--radius-sm);
  transition:
    background var(--t-fast) var(--ease),
    color var(--t-fast) var(--ease);

  &:hover,
  &:focus-visible {
    background: var(--glass-line);
    outline: none;
  }

  &[aria-selected="true"] {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  ${(p) =>
    p.$muted &&
    css`
      color: var(--fg-2);
      font-size: 13px;
    `}
`;

export const ResultName = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 14.5px;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  small {
    font-weight: 500;
    display: block;
    color: var(--fg-2);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

/* Account menu: a small glass card hanging off the avatar. Desktop only —
   on phones the tab bar goes straight to the account page. Fixed, and a
   sibling of the header rather than a child, for the same reason as the
   search panel: nested inside the header's backdrop-filter it could only
   blur the header, never the page behind it. */
export const Menu = styled.div`
  position: fixed;
  top: calc(max(var(--header-h, 64px), 56px) + 8px);
  right: calc(env(safe-area-inset-right, 0px) + 10px);
  z-index: 13;
  min-width: 216px;
  padding: 6px;
  border-radius: var(--radius-md);
  ${liquidGlass}
  box-shadow: var(--sh);
  animation: menuIn 140ms var(--spring);

  @keyframes menuIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** Which account this is: the avatar alone does not say. */
export const MenuHead = styled.div`
  padding: 8px 10px 10px;
  border-bottom: 1px solid var(--glass-line);
  margin-bottom: 6px;

  strong {
    display: block;
    font-size: 14px;
    font-weight: 650;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--fg-3);
    overflow-wrap: anywhere;
  }
`;

export const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--r-ctl);
  font-size: 14px;
  font-weight: 550;
  color: var(--fg);
  text-align: left;
  text-decoration: none;
  cursor: pointer;

  svg {
    flex: none;
    color: var(--fg-3);
  }

  &:hover,
  &:focus-visible {
    background: var(--row-hover);
  }

  &:hover svg,
  &:focus-visible svg {
    color: var(--fg-2);
  }
`;
