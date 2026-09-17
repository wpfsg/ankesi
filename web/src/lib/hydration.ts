/** True from the start of hydration until the first effects run. Pages that
 *  read the URL query or storage for their initial state must render the
 *  prerendered defaults during that window so the markup matches. */
let hydrating = false

export function markHydrating(v: boolean) {
  hydrating = v
}

export function isHydrating(): boolean {
  return hydrating
}
