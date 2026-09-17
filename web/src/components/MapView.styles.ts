import styled, { css } from 'styled-components'
import { bandVar, tabular } from '../styles/shared'

/** Full-screen map container. Marker bubbles are created imperatively for
 *  MapLibre (see makeBubble), so their rules are nested here by class. */
export const MapRoot = styled.div`
  /* MapLibre's stylesheet sets .maplibregl-map to position: relative and
     overflow: hidden; the compound selector keeps our full-screen layout. */
  &,
  &.maplibregl-map {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .maplibregl-canvas {
    outline: none;
  }

  /* Dark theme inverts the map to match, except for layers flagged
     keepColors (imagery, and the deliberately light style). */
  :root[data-theme='dark'] &:not([data-keep-colors]) .maplibregl-canvas {
    filter: invert(1) hue-rotate(180deg) brightness(0.85) saturate(0.7);
  }

  /* blue dot for the user's own position (plain element, see MapView) */
  [data-user-dot] {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #2f80ed;
    border: 3px solid #fff;
    box-shadow: 0 0 0 6px rgba(47, 128, 237, 0.25), 0 2px 6px rgba(15, 23, 32, 0.3);
  }

  /* marker wrapper: maplibre owns its transform, so scale the inner bubble */
  .marker {
    width: 0;
    height: 0;
  }

  .bubble {
    ${bandVar}
    position: absolute;
    left: -21px;
    top: -21px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 15px;
    ${tabular}
    color: #fff;
    background: var(--band);
    border: 2px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 2px 8px rgba(15, 23, 32, 0.3);
    cursor: pointer;
    transition: transform 260ms var(--spring), opacity 200ms, box-shadow 200ms, border-color 200ms;
    will-change: transform;
  }

  .bubble[data-type='sea'] {
    border-style: dashed;
  }

  .bubble[data-type='paid'] {
    border-radius: 12px;
  }

  .bubble[data-band='none'] {
    color: rgba(255, 255, 255, 0.85);
  }

  /* Hover lifts the bubble; the wrapper gets the z-index because each
     MapLibre marker is its own stacking context. Pointer-only so touch
     devices don't get a stuck hover state after tapping. */
  @media (hover: hover) {
    .marker:hover {
      z-index: 3;
    }

    .bubble:hover,
    .bubble.dim:hover {
      transform: scale(1.14);
      opacity: 1;
      border-color: #fff;
      box-shadow: 0 6px 18px rgba(15, 23, 32, 0.35);
    }

    .bubble.selected:hover {
      transform: scale(1.32);
    }
  }

  .bubble.selected {
    transform: scale(1.25);
    z-index: 2;
    box-shadow: 0 0 0 3px var(--srf), 0 0 0 5px var(--band), 0 10px 28px rgba(15, 23, 32, 0.3);
  }

  .bubble.dim {
    opacity: 0.55;
  }

  .bubble.cluster {
    width: 46px;
    height: 46px;
    left: -23px;
    top: -23px;
    font-size: 15.5px;
  }

  .bubble.cluster small {
    position: absolute;
    top: -5px;
    right: -5px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--fg);
    color: var(--bg);
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
  }
`

/* Zoom / locate / fit controls in a row along the bottom right, above the
   attribution and clear of the vertical layer rail. On desktop they slide
   left when the detail panel is open. */
export const Controls = styled.div<{ $shift?: boolean }>`
  position: fixed;
  right: 12px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + var(--tabbar-h, 0px) + 12px);
  z-index: 14;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;

  @media (min-width: 720px) {
    right: 16px;
    bottom: 34px;
    transition: right 220ms var(--spring);
    ${(p) =>
      p.$shift &&
      css`
        right: 416px;
      `}
  }
`

export const ZoomGroup = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 13px;
  overflow: hidden;
  background: var(--ctl-bg);
  box-shadow: var(--sh-ctl);
  border: 1px solid var(--brd);

  button {
    width: 42px;
    height: 38px;
    color: var(--fg-2);
    display: grid;
    place-items: center;
  }

  button:hover {
    color: var(--fg);
  }

  button + button {
    border-left: 1px solid var(--brd);
  }
`
