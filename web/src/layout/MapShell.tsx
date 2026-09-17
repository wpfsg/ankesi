import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styled from 'styled-components'
import { paths } from '../lib/routes'
import { VisuallyHidden } from '../styles/page'
import { BrandMark } from './BrandMark'
import { useLang } from './useLang'

const Shell = styled.div`
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 24px 16px;
  text-align: center;

  h1 {
    margin: 14px 0 4px;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    color: var(--fg-2);
    font-size: 14px;
  }
`

/** What the map route shows before its chunk loads and what crawlers get
 *  for the language roots: the brand, the promise, and links onward. */
export function MapShell() {
  const { t } = useTranslation()
  const lang = useLang()
  return (
    <Shell>
      <div>
        <BrandMark size={56} />
        <h1>{t('app.title')}</h1>
        <p>{t('app.tagline')}</p>
        <VisuallyHidden as="nav" aria-label={t('nav.primary')}>
          <ul>
            <li>
              <Link to={paths.spots(lang)}>{t('nav.spots')}</Link>
            </li>
            <li>
              <Link to={paths.how(lang)}>{t('nav.how')}</Link>
            </li>
            <li>
              <Link to={paths.pricing(lang)}>{t('nav.pricing')}</Link>
            </li>
            <li>
              <Link to={paths.faq(lang)}>{t('nav.faq')}</Link>
            </li>
          </ul>
        </VisuallyHidden>
      </div>
    </Shell>
  )
}
