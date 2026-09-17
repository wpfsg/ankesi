import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { VisuallyHidden } from '../styles/page'

/** After each navigation: scroll to the top (or the hash target), move focus
 *  to the main landmark and announce the new page title. */
export function RouteAnnouncer() {
  const { t } = useTranslation()
  const { pathname, hash } = useLocation()
  const first = useRef(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (first.current) {
      first.current = false
      if (hash) document.getElementById(hash.slice(1))?.scrollIntoView()
      return
    }
    const id = window.setTimeout(() => {
      if (hash) {
        const target = document.getElementById(hash.slice(1))
        if (target) {
          target.scrollIntoView()
          if (target instanceof HTMLElement) target.focus({ preventScroll: true })
        }
      } else {
        window.scrollTo(0, 0)
        const main = document.getElementById('main')
        if (main) main.focus({ preventScroll: true })
      }
      setMessage(t('a11y.navigated', { title: document.title }))
    }, 60)
    return () => window.clearTimeout(id)
  }, [pathname, hash, t])

  return (
    <VisuallyHidden as="div" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </VisuallyHidden>
  )
}
