import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import type { FactorKey } from '../types'
import { WEIGHTS, MODEL_VERSION } from '../lib/scoring'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { breadcrumbList } from '../lib/seo'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { Tabular } from '../styles/shared'
import { ButtonLink, ButtonRow, Card, CardGrid, Eyebrow, GhostLink, H1, H2, H3, Lead, Muted, Page, PageHead, Prose, Section } from '../styles/page'

/* The nine factors as the panel shows them; water and waves share a slot. */
const FACTORS: { key: FactorKey; alt?: FactorKey }[] = [
  { key: 'timeOfDay' },
  { key: 'pressureTrend' },
  { key: 'waterTemp' },
  { key: 'wind' },
  { key: 'light' },
  { key: 'water', alt: 'waves' },
  { key: 'pressureLevel' },
  { key: 'moon' },
  { key: 'season' },
]

const BandRow = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin-top: 12px;

  > div {
    padding: 10px 8px;
    border-radius: 10px;
    color: #fff;
    text-align: center;
    font-size: 12.5px;
    font-weight: 650;
    line-height: 1.3;
  }

  small {
    display: block;
    font-weight: 500;
    opacity: 0.9;
  }
`

const Weight = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  span:last-child {
    font-size: 12.5px;
    font-weight: 650;
    color: var(--accent);
  }
`

const Bar = styled.div`
  height: 6px;
  border-radius: 999px;
  background: var(--ring-track);
  margin-bottom: 10px;
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--accent);
    border-radius: 999px;
  }
`

const SourceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th,
  td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid var(--brd);
    vertical-align: top;
  }

  th {
    font-size: 12.5px;
    color: var(--fg-3);
    font-weight: 650;
  }

  td:last-child {
    white-space: nowrap;
  }
`

const SOURCES = ['weather', 'marine', 'astro', 'map', 'waterTemp', 'waterLevel', 'reports'] as const

/** Methodology: what the score is, the nine factors and weights, sources,
 *  confidence, community correction and known limits. */
export function HowItWorksPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const crumbs = [{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.how') }]
  const maxWeight = Math.max(...Object.values(WEIGHTS))

  return (
    <Page>
      <Head
        title={t('seo.how.title')}
        description={t('seo.how.description')}
        path={paths.how(lang)}
        lang={lang}
        type="article"
        jsonLd={[
          breadcrumbList(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'TechArticle',
            headline: t('seo.how.title'),
            description: t('seo.how.description'),
            inLanguage: lang,
            author: { '@type': 'Organization', name: lang === 'ka' ? 'ანკესი' : 'Ankesi' },
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>{t('how.eyebrow')}</Eyebrow>
        <H1>{t('how.title')}</H1>
        <Lead>{t('how.lead')}</Lead>
      </PageHead>

      <Section id="score" style={{ marginTop: 0 }}>
        <H2>{t('how.score.title')}</H2>
        <Prose>
          <p>{t('how.score.p1')}</p>
          <p>{t('how.score.p2')}</p>
        </Prose>
        <BandRow aria-label={t('legend.title')}>
          <div style={{ background: 'var(--band-dead)' }}>
            {t('band.dead')}
            <small>0–34</small>
          </div>
          <div style={{ background: 'var(--band-slow)' }}>
            {t('band.slow')}
            <small>35–51</small>
          </div>
          <div style={{ background: 'var(--band-ok)' }}>
            {t('band.ok')}
            <small>52–67</small>
          </div>
          <div style={{ background: 'var(--band-good)' }}>
            {t('band.good')}
            <small>68–81</small>
          </div>
          <div style={{ background: 'var(--band-great)' }}>
            {t('band.great')}
            <small>82–100</small>
          </div>
        </BandRow>
      </Section>

      <Section id="factors">
        <H2>{t('how.factors.title')}</H2>
        <Prose>
          <p>{t('how.factors.lead')}</p>
        </Prose>
        <CardGrid $min={280} style={{ marginTop: 18 }}>
          {FACTORS.map(({ key, alt }) => (
            <Card key={key} as="article">
              <Weight>
                <H3 style={{ margin: 0 }}>
                  {t(`factor.${key}`)}
                  {alt ? ` / ${t(`factor.${alt}`)}` : ''}
                </H3>
                <span>
                  <Tabular>{WEIGHTS[key]}</Tabular> / 100
                </span>
              </Weight>
              <Bar aria-hidden="true">
                <span style={{ width: `${(WEIGHTS[key] / maxWeight) * 100}%` }} />
              </Bar>
              <Prose style={{ fontSize: 14 }}>
                <p>{t(`how.factors.items.${key}`)}</p>
              </Prose>
            </Card>
          ))}
        </CardGrid>
        <Muted style={{ marginTop: 14 }}>{t('how.factors.rain')}</Muted>
      </Section>

      <Section id="weights">
        <H2>{t('how.weights.title')}</H2>
        <Prose>
          <p>{t('how.weights.p1', { version: MODEL_VERSION })}</p>
          <p>{t('how.weights.p2')}</p>
        </Prose>
      </Section>

      <Section id="sources">
        <H2>{t('how.sources.title')}</H2>
        <Card style={{ padding: 8 }}>
          <SourceTable>
            <thead>
              <tr>
                <th>{t('how.sources.colData')}</th>
                <th>{t('how.sources.colSource')}</th>
                <th>{t('how.sources.colKind')}</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s}>
                  <td>{t(`how.sources.rows.${s}.data`)}</td>
                  <td>{t(`how.sources.rows.${s}.source`)}</td>
                  <td>{t(`how.sources.rows.${s}.kind`)}</td>
                </tr>
              ))}
            </tbody>
          </SourceTable>
        </Card>
        <Muted style={{ marginTop: 12 }}>{t('how.sources.update')}</Muted>
      </Section>

      <Section id="confidence">
        <H2>{t('how.confidence.title')}</H2>
        <Prose>
          <p>{t('how.confidence.p1')}</p>
          <ul>
            <li>
              <strong>{t('confidence.low')}</strong> — {t('how.confidence.low')}
            </li>
            <li>
              <strong>{t('confidence.medium')}</strong> — {t('how.confidence.medium')}
            </li>
            <li>
              <strong>{t('confidence.high')}</strong> — {t('how.confidence.high')}
            </li>
          </ul>
        </Prose>
      </Section>

      <Section id="community">
        <H2>{t('how.community.title')}</H2>
        <Prose>
          <p>{t('how.community.p1')}</p>
          <p>{t('how.community.p2')}</p>
        </Prose>
      </Section>

      <Section id="limits">
        <H2>{t('how.limits.title')}</H2>
        <Prose>
          <ul>
            <li>{t('how.limits.l1')}</li>
            <li>{t('how.limits.l2')}</li>
            <li>{t('how.limits.l3')}</li>
            <li>{t('how.limits.l4')}</li>
          </ul>
        </Prose>
        <ButtonRow>
          <ButtonLink to={paths.map(lang)}>{t('how.cta.map')}</ButtonLink>
          <GhostLink to={paths.faq(lang)}>{t('how.cta.faq')}</GhostLink>
        </ButtonRow>
      </Section>
    </Page>
  )
}
