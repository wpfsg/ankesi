import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { toggleTheme } from '../lib/theme'
import { IconToggle } from './Header.styles'

/* Both icons are in the markup and CSS picks one from the <html> theme, so
   server and client render identically whatever the user's theme is. */
const Toggle = styled(IconToggle)`
  [data-when='dark'] {
    display: none;
  }

  :root[data-theme='dark'] & [data-when='dark'] {
    display: block;
  }

  :root[data-theme='dark'] & [data-when='light'] {
    display: none;
  }
`

/** Sun / moon button that flips the colour theme. */
export function ThemeToggle() {
  const { t } = useTranslation()
  return (
    <Toggle type="button" onClick={() => toggleTheme()} aria-label={t('theme.toggle')} title={t('theme.toggle')}>
      <svg data-when="dark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg data-when="light" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </Toggle>
  )
}
