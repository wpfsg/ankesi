import styled, { css } from 'styled-components'

/* iOS-style liquid glass: heavy blur and saturation, a bright top edge and
   a soft outer shadow so the rail reads as a floating slab over the map. */
export const Rail = styled.nav<{ $hidden?: boolean }>`
  position: fixed;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 11;
  padding: 6px;
  border-radius: 30px;
  background: var(--glass-bg);
  -webkit-backdrop-filter: blur(28px) saturate(1.8);
  backdrop-filter: blur(28px) saturate(1.8);
  border: 1px solid var(--glass-border);
  box-shadow:
    0 14px 40px rgba(0, 0, 0, 0.16),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.65),
    inset 0 -1px 0 rgba(255, 255, 255, 0.2);

  :root[data-theme='dark'] & {
    box-shadow:
      0 14px 40px rgba(0, 0, 0, 0.5),
      0 2px 6px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.14),
      inset 0 -1px 0 rgba(255, 255, 255, 0.04);
  }

  ${(p) =>
    p.$hidden &&
    css`
      display: none;
    `}

  @media (max-width: 480px) {
    right: 8px;
    padding: 5px;
    border-radius: 26px;
  }
`

export const RailGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

export const RailSwatch = styled.span`
  width: 42px;
  height: 42px;
  border-radius: 15px;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition:
    box-shadow var(--t) var(--ease),
    transform var(--t) var(--ease);

  @media (max-width: 480px) {
    width: 38px;
    height: 38px;
    border-radius: 13px;
  }
`

export const RailItem = styled.button`
  width: 76px;
  padding: 7px 4px 6px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: var(--fg-2);
  font-size: 10.5px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  transition:
    background var(--t) var(--ease),
    color var(--t) var(--ease),
    transform var(--t) var(--ease);

  &:hover {
    color: var(--fg);
    background: var(--glass-line);
  }

  &:active {
    transform: scale(0.96);
  }

  &[aria-checked='true'] {
    color: var(--fg);
    background: var(--glass-line);
  }

  &[aria-checked='true'] ${RailSwatch} {
    box-shadow:
      0 0 0 2px var(--accent),
      0 0 0 4px color-mix(in srgb, var(--accent) 25%, transparent),
      inset 0 0 0 1px rgba(0, 0, 0, 0.08);
    transform: scale(1.04);
  }

  /* thumbnails: sky/land/water cues for each base map */
  &[data-layer='satellite'] ${RailSwatch} {
    background:
      radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.35), transparent 40%),
      linear-gradient(160deg, #4f7a3a 0%, #3b6a2e 45%, #1f4f7a 55%, #163a5c 100%);
  }
  &[data-layer='positron'] ${RailSwatch} {
    background:
      linear-gradient(160deg, #f6f5f2 0%, #f6f5f2 52%, #dfe6ea 52%, #dfe6ea 100%);
  }
  &[data-layer='bright'] ${RailSwatch} {
    background:
      linear-gradient(160deg, #f8f4e9 0%, #f3ecd9 50%, #a8d8ff 50%, #8cc6f5 100%);
  }
  &[data-layer='liberty'] ${RailSwatch} {
    background:
      linear-gradient(160deg, #eef2dc 0%, #e6ead2 50%, #a9d0f0 50%, #8fc0e8 100%);
  }
  &[data-layer='osm'] ${RailSwatch} {
    background:
      linear-gradient(160deg, #f2efe9 0%, #f2efe9 50%, #aad3df 50%, #aad3df 100%);
  }

  @media (max-width: 480px) {
    width: 74px;
    padding: 6px 2px 5px;
    border-radius: 21px;
    font-size: 10px;
  }
`

export const RailLabel = styled.span`
  max-width: 72px;
  text-align: center;
  line-height: 1.15;
  /* Georgian labels are long; wrap to a second line rather than clip */
  white-space: normal;
  text-wrap: balance;

  @media (max-width: 480px) {
    max-width: 70px;
  }
`
