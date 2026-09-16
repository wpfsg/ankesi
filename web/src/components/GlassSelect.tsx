import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trigger, Menu, MenuList, Option } from './GlassSelect.styles'

export interface GlassOption<V extends string> {
  value: V
  label: string
}

interface Props<V extends string> {
  /** Current value; '' means "nothing selected" and shows `placeholder`. */
  value: V | ''
  options: GlassOption<V>[]
  /** Chip label while nothing is selected. */
  placeholder: string
  /** Label of the first, "no filter" option in the menu. */
  allLabel: string
  ariaLabel: string
  onChange: (value: V | '') => void
}

const GAP = 6

/** Chip-styled select with a liquid-glass popover menu. Rendered in a portal
 *  so overflow-hidden panels cannot clip it; closes on outside pointer,
 *  Escape or resize. */
export function GlassSelect<V extends string>({ value, options, placeholder, allLabel, ariaLabel, onChange }: Props<V>) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [active, setActive] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const all = useMemo(() => [{ value: '' as V | '', label: allLabel }, ...options], [allLabel, options])
  const selected = value === '' ? { value: '' as const, label: placeholder } : (all.find((o) => o.value === value) ?? all[0])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    const width = Math.max(200, r.width)
    const left = Math.min(r.left, window.innerWidth - width - 8)
    const below = window.innerHeight - r.bottom
    const top = below > 200 ? r.bottom + GAP : Math.max(8, r.top - GAP - Math.min(320, window.innerHeight * 0.6))
    setPos({ top, left: Math.max(8, left), width })
    setActive(Math.max(0, all.findIndex((o) => o.value === value)))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        triggerRef.current?.focus()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        onChange(all[active].value)
        close()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
    }
  }, [open, active, all, onChange])

  return (
    <>
      <Trigger
        ref={triggerRef}
        type="button"
        $on={value !== ''}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${ariaLabel}: ${selected.label}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{selected.label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </Trigger>
      {open &&
        pos &&
        createPortal(
          <Menu ref={menuRef} style={{ top: pos.top, left: pos.left, minWidth: pos.width }}>
            <MenuList id={listId} role="listbox" aria-label={ariaLabel}>
            {all.map((o, i) => (
              <Option
                key={o.value || '__all'}
                type="button"
                role="option"
                aria-selected={o.value === value}
                $selected={o.value === value}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
              >
                {o.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </Option>
            ))}
            </MenuList>
          </Menu>,
          document.body,
        )}
    </>
  )
}
