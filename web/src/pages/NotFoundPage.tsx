import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { useLang } from '../layout/useLang'
import { ButtonLink, ButtonRow, Eyebrow, GhostLink, H1, Lead, Page, PageHead } from '../styles/page'

/** Localized 404. Also prerendered as 404.html for the static host. */
export function NotFoundPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { pathname } = useLocation()
  return (
    <Page $narrow>
      <Head title={t('notFound.title')} description={t('notFound.lead')} path={pathname} lang={lang} noindex />
      <PageHead>
        <Eyebrow>404</Eyebrow>
        <H1>{t('notFound.title')}</H1>
        <Lead>{t('notFound.lead')}</Lead>
      </PageHead>
      <ButtonRow>
        <ButtonLink to={paths.map(lang)}>{t('notFound.toMap')}</ButtonLink>
        <GhostLink to={paths.spots(lang)}>{t('notFound.toSpots')}</GhostLink>
      </ButtonRow>
    </Page>
  )
}
