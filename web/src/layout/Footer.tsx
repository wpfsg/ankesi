import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { Region } from '../types'
import { paths } from '../lib/routes'
import { BrandMark } from './BrandMark'
import { useLang } from './useLang'
import { Attribution, Bottom, Col, Cols, FooterInner, FooterRoot, Tagline } from './Footer.styles'

const REGIONS: Region[] = [
  'tbilisi',
  'kakheti',
  'kvemo-kartli',
  'mtskheta-mtianeti',
  'shida-kartli',
  'samtskhe-javakheti',
  'imereti',
  'racha',
  'samegrelo',
  'guria',
  'adjara',
]

/** Four columns: product, spots by region, learn, legal and sources. */
export function Footer() {
  const { t } = useTranslation()
  const lang = useLang()
  const year = new Date().getUTCFullYear()

  return (
    <FooterRoot>
      <FooterInner>
        <Cols>
          <Col>
            <h2>{t('footer.product')}</h2>
            <ul>
              <li>
                <Link to={paths.map(lang)}>{t('nav.map')}</Link>
              </li>
              <li>
                <Link to={paths.spots(lang)}>{t('nav.spots')}</Link>
              </li>
              <li>
                <Link to={paths.reports(lang)}>{t('nav.reports')}</Link>
              </li>
              <li>
                <Link to={paths.pricing(lang)}>{t('nav.pricing')}</Link>
              </li>
              <li>
                <Link to={paths.account(lang)}>{t('nav.account')}</Link>
              </li>
            </ul>
          </Col>
          <Col>
            <h2>{t('footer.byRegion')}</h2>
            <ul>
              {REGIONS.map((r) => (
                <li key={r}>
                  <Link to={paths.region(lang, r)}>{t(`region.${r}`)}</Link>
                </li>
              ))}
            </ul>
          </Col>
          <Col>
            <h2>{t('footer.learn')}</h2>
            <ul>
              <li>
                <Link to={paths.how(lang)}>{t('nav.how')}</Link>
              </li>
              <li>
                <Link to={`${paths.how(lang)}#factors`}>{t('footer.factors')}</Link>
              </li>
              <li>
                <Link to={`${paths.how(lang)}#sources`}>{t('footer.dataSources')}</Link>
              </li>
              <li>
                <Link to={paths.faq(lang)}>{t('nav.faq')}</Link>
              </li>
              <li>
                <Link to={`${paths.faq(lang)}#fishing`}>{t('footer.regulations')}</Link>
              </li>
            </ul>
          </Col>
          <Col>
            <h2>{t('footer.legal')}</h2>
            <ul>
              <li>
                <Link to={`${paths.faq(lang)}#is-it-allowed`}>{t('footer.disclaimer')}</Link>
              </li>
              <li>
                <a href="https://mepa.gov.ge" rel="noreferrer" target="_blank">
                  {t('footer.ministry')}
                </a>
              </li>
              <li>
                <a href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">
                  © OpenStreetMap
                </a>
              </li>
              <li>
                <a href="https://openfreemap.org" rel="noreferrer" target="_blank">
                  OpenFreeMap
                </a>
              </li>
              <li>
                <a href="https://open-meteo.com" rel="noreferrer" target="_blank">
                  Open-Meteo
                </a>
              </li>
            </ul>
          </Col>
        </Cols>

        <Bottom>
          <Tagline>
            <BrandMark size={22} />
            <span>
              <b>{t('app.title')}</b> · {t('app.tagline')}
            </span>
          </Tagline>
          <Attribution>
            {t('footer.attribution')}
            <br />© {year} {t('app.title')}. {t('footer.rights')}
          </Attribution>
        </Bottom>
      </FooterInner>
    </FooterRoot>
  )
}
