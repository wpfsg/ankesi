/** The fish-eye mark used in the header, drawer and tab bar. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="30" fill="var(--accent)" />
      <path d="M17 34c7-11 22-11 29 0-7 11-22 11-29 0z" fill="var(--accent-fg)" />
      <circle cx="39" cy="33" r="2.4" fill="var(--accent)" />
    </svg>
  )
}
