import styled, { css } from "styled-components";
import { glass, tabular } from "../styles/shared";

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

export const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  font-weight: 700;
  font-size: 17px;
  color: var(--fg);

  @media (min-width: 720px) {
    justify-self: start;
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
`

/** "Updated HH:MM" next to the controls; hidden on phones. */
export const Updated = styled.span`
  display: none;
  font-size: 12.5px;
  color: var(--fg-3);
  white-space: nowrap;
  ${tabular}

  @media (min-width: 720px) {
    display: inline;
  }
`

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

  button[aria-pressed='true'] {
    background: var(--ctl-bg);
    color: var(--fg);
    box-shadow: 0 1px 3px rgba(15, 23, 32, 0.14);
  }
`

export const Avatar = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--pri-fg);
  color: var(--pri);
  font-size: 12px;
  font-weight: 700;
`

export const AccountBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  min-width: 40px;
  padding: 0 10px;
  flex: none;
  border-radius: 999px;
  background: var(--pri);
  color: var(--pri-fg);
  font-weight: 600;
  font-size: 14px;
  box-shadow: var(--pri-shadow);

  &:hover {
    filter: brightness(1.05);
  }

  @media (min-width: 720px) {
    padding: 0 16px;
  }
`

export const AccountLabel = styled.span`
  display: none;

  @media (min-width: 720px) {
    display: inline;
  }
`;

const Results = styled.div`
  ${glass}
  border-radius: var(--radius-md);
  padding: 6px;
  max-height: 50vh;
  overflow-y: auto;
`;

export const HeaderResults = styled(Results)`
  position: absolute;
  top: calc(100% + 6px);
  left: 12px;
  right: 12px;
  background: var(--glass-bg-strong);

  @media (min-width: 720px) {
    /* sit directly under the centred search field */
    left: 50%;
    right: auto;
    width: min(560px, 36vw, calc(100% - 40px));
    transform: translateX(-50%);
  }
`;

export const Result = styled.button<{ $muted?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-sm);

  &:hover,
  &:focus-visible {
    background: var(--glass-line);
    outline: none;
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

  small {
    display: block;
    color: var(--fg-2);
    font-size: 12px;
  }
`;
