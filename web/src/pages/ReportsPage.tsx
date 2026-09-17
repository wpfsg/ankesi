import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styled from 'styled-components'
import { SPOTS } from '../data/spots'
import { hasBackend } from '../lib/backend'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { breadcrumbList } from '../lib/seo'
import { timeAgo } from '../lib/format'
import { spotName } from '../lib/spotInfo'
import { useReports } from '../lib/useReports'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { MiniBubble, Notice } from '../styles/shared'
import { ButtonLink, ButtonRow, Card, Eyebrow, GhostLink, H1, H2, Lead, Page, PageHead, Prose, Section } from '../styles/page'

const ACTIVITY_BAND: Record<number, string> = { [-2]: 'dead', [-1]: 'slow', 0: 'ok', 1: 'good', 2: 'great' }

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--brd);
  }

  li:last-child {
    border-bottom: 0;
  }

  a {
    color: var(--fg);
    font-weight: 650;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  small {
    display: block;
    color: var(--fg-3);
    margin-top: 2px;
  }
`

/** Community feed: the latest condition reports across all spots. */
export function ReportsPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { all, ready } = useReports()
  const crumbs = [{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.reports') }]
  const byId = Object.fromEntries(SPOTS.map((s) => [s.id, s]))

  return (
    <Page $narrow>
      <Head title={t('seo.reports.title')} description={t('seo.reports.description')} path={paths.reports(lang)} lang={lang} jsonLd={[breadcrumbList(crumbs)]} />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>{t('reports.eyebrow')}</Eyebrow>
        <H1>{t('reports.title')}</H1>
        <Lead>{t('reports.lead')}</Lead>
      </PageHead>

      {!hasBackend && <Notice>{t('reports.noBackend')}</Notice>}

      <Card style={{ marginTop: 16 }}>
        {all.length === 0 ? (
          <Prose>
            <p>{ready ? t('reports.empty') : t('common.loading')}</p>
          </Prose>
        ) : (
          <List>
            {all.slice(0, 50).map((r) => {
              const band = ACTIVITY_BAND[r.activity] ?? 'none'
              const spot = byId[r.spotId]
              return (
                <li key={r.id}>
                  <MiniBubble data-band={band}>{r.activity > 0 ? `+${r.activity}` : r.activity}</MiniBubble>
                  <div>
                    {spot ? <Link to={paths.spot(lang, spot.id)}>{spotName(spot, lang)}</Link> : <strong>{r.spotId}</strong>}
                    {' · '}
                    {t(`band.${band}`)}
                    {r.note ? ` — ${r.note}` : ''}
                    <small>
                      {r.displayName || t('report.anonymous')} · {timeAgo(r.createdAt, lang)}
                    </small>
                  </div>
                </li>
              )
            })}
          </List>
        )}
      </Card>

      <Section>
        <H2>{t('reports.howTitle')}</H2>
        <Prose>
          <p>{t('reports.how1')}</p>
          <p>{t('reports.how2')}</p>
        </Prose>
        <ButtonRow>
          <ButtonLink to={paths.map(lang)}>{t('reports.add')}</ButtonLink>
          <GhostLink to={paths.how(lang) + '#community'}>{t('reports.learnMore')}</GhostLink>
        </ButtonRow>
      </Section>
    </Page>
  )
}
