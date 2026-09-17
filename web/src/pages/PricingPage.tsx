import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styled, { css } from 'styled-components'
import { FEATURES, PLANS, type Cell } from '../content/pricing'
import { PRICING_FAQ_IDS } from '../content/faq'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { breadcrumbList } from '../lib/seo'
import { absoluteUrl } from '../lib/site'
import { fmtGel } from '../lib/format'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { ButtonLink, ButtonRow, Card, Eyebrow, GhostLink, H1, H2, H3, Lead, Muted, Page, PageHead, Pill, Prose, Section, TextLink } from '../styles/page'

const Plans = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: 1fr;

  @media (min-width: 840px) {
    grid-template-columns: repeat(3, 1fr);
    align-items: stretch;
  }
`

const PlanCard = styled(Card)<{ $rec?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;

  ${(p) =>
    p.$rec &&
    css`
      border-color: var(--pri);
      box-shadow: 0 0 0 1px var(--pri), var(--sh-ctl);

      @media (min-width: 840px) {
        order: -1;
      }
      @media (min-width: 840px) {
        order: 0;
        transform: translateY(-6px);
      }
    `}
`

const Price = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-variant-numeric: tabular-nums;

  b {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  span {
    color: var(--fg-3);
    font-size: 14px;
  }
`

const Badge = styled.span<{ $rec?: boolean }>`
  align-self: flex-start;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 650;
  background: var(--ctl-bg-2);
  color: var(--fg-2);

  ${(p) =>
    p.$rec &&
    css`
      background: var(--pri);
      color: var(--pri-fg);
    `}
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14.5px;

  th,
  td {
    padding: 12px 10px;
    border-bottom: 1px solid var(--brd);
    text-align: left;
  }

  th {
    font-size: 12.5px;
    color: var(--fg-3);
    font-weight: 650;
  }

  td:not(:first-child),
  th:not(:first-child) {
    text-align: center;
    width: 22%;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`

const Check = styled.span<{ $on: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: ${(p) => (p.$on ? 'var(--up-bg)' : 'var(--ctl-bg-2)')};
  color: ${(p) => (p.$on ? 'var(--up-fg)' : 'var(--fg-3)')};
`

const Logos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`

function cell(c: Cell, t: (k: string) => string) {
  if (typeof c === 'string') return <span>{t(`pricing.values.${c}`)}</span>
  return (
    <Check $on={c} aria-label={t(c ? 'pricing.included' : 'pricing.notIncluded')}>
      {c ? '✓' : '–'}
    </Check>
  )
}

/** Free vs premium, three plans with the annual one emphasised, comparison
 *  table, payment note and the billing FAQ. Checkout is a stub for now. */
export function PricingPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const crumbs = [{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.pricing') }]

  return (
    <Page>
      <Head
        title={t('seo.pricing.title')}
        description={t('seo.pricing.description')}
        path={paths.pricing(lang)}
        lang={lang}
        jsonLd={[
          breadcrumbList(crumbs),
          {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: t('pricing.productName'),
            description: t('seo.pricing.description'),
            brand: { '@type': 'Brand', name: lang === 'ka' ? 'ანკესი' : 'Ankesi' },
            offers: PLANS.map((p) => ({
              '@type': 'Offer',
              name: t(`pricing.plans.${p.id}.name`),
              price: p.priceGel.toFixed(2),
              priceCurrency: 'GEL',
              url: absoluteUrl(paths.checkout(lang, p.id)),
              availability: 'https://schema.org/PreOrder',
            })),
          },
        ]}
      />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>{t('pricing.eyebrow')}</Eyebrow>
        <H1>{t('pricing.title')}</H1>
        <Lead>{t('pricing.lead')}</Lead>
      </PageHead>

      <Plans>
        {PLANS.map((p) => (
          <PlanCard key={p.id} $rec={p.recommended} as="article" aria-label={t(`pricing.plans.${p.id}.name`)}>
            {p.badge && <Badge $rec={p.recommended}>{t(`pricing.badges.${p.badge}`)}</Badge>}
            <H3 as="h2" style={{ margin: 0 }}>
              {t(`pricing.plans.${p.id}.name`)}
            </H3>
            <Price>
              <b>{fmtGel(p.priceGel, lang)}</b>
              <span>/ {t(`pricing.period.${p.period}`)}</span>
            </Price>
            <Muted>
              {p.perMonthGel ? t('pricing.perMonthEq', { price: fmtGel(p.perMonthGel, lang) }) : t(`pricing.plans.${p.id}.sub`)}
            </Muted>
            <Prose style={{ fontSize: 14, marginTop: 4 }}>
              <p>{t(`pricing.plans.${p.id}.desc`)}</p>
            </Prose>
            <div style={{ marginTop: 'auto' }}>
              {p.recommended ? (
                <ButtonLink to={paths.checkout(lang, p.id)} style={{ width: '100%' }}>
                  {t('pricing.choose')}
                </ButtonLink>
              ) : (
                <GhostLink to={paths.checkout(lang, p.id)} style={{ width: '100%' }}>
                  {t('pricing.choose')}
                </GhostLink>
              )}
            </div>
          </PlanCard>
        ))}
      </Plans>
      <Muted style={{ marginTop: 14 }}>
        {t('pricing.cancelAnytime')} · {t('pricing.pricesNote')}
      </Muted>

      <Section id="compare">
        <H2>{t('pricing.compareTitle')}</H2>
        <Prose>
          <p>{t('pricing.compareLead')}</p>
        </Prose>
        <Card style={{ padding: 6, marginTop: 14 }}>
          <Table>
            <thead>
              <tr>
                <th scope="col">{t('pricing.feature')}</th>
                <th scope="col">{t('pricing.free')}</th>
                <th scope="col">{t('pricing.premium')}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.id}>
                  <td>{t(`pricing.features.${f.id}`)}</td>
                  <td>{cell(f.free, t)}</td>
                  <td>{cell(f.premium, t)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <ButtonRow>
          <GhostLink to={paths.map(lang)}>{t('pricing.startFree')}</GhostLink>
          <ButtonLink to={paths.checkout(lang, 'annual')}>{t('pricing.goPremium')}</ButtonLink>
        </ButtonRow>
      </Section>

      <Section id="payments">
        <H2>{t('pricing.paymentsTitle')}</H2>
        <Prose>
          <p>{t('pricing.paymentsLead')}</p>
        </Prose>
        <Logos aria-label={t('pricing.paymentsTitle')}>
          <Pill>Visa</Pill>
          <Pill>Mastercard</Pill>
          <Pill>TBC Pay</Pill>
          <Pill>BOG iPay</Pill>
          <Pill>Apple Pay</Pill>
          <Pill>Google Pay</Pill>
        </Logos>
      </Section>

      <Section id="faq">
        <H2>{t('pricing.faqTitle')}</H2>
        <Card style={{ padding: '4px 16px' }}>
          {PRICING_FAQ_IDS.map((id) => (
            <details key={id} style={{ borderBottom: '1px solid var(--brd)', padding: '10px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 15 }}>{t(`faq.items.${id}.q`)}</summary>
              <Prose style={{ marginTop: 8 }}>
                <p>{t(`faq.items.${id}.a`)}</p>
              </Prose>
            </details>
          ))}
        </Card>
        <Muted style={{ marginTop: 12 }}>
          <TextLink to={paths.faq(lang) + '#billing'}>{t('pricing.moreFaq')}</TextLink>
        </Muted>
      </Section>

      <Section>
        <Card style={{ textAlign: 'center', padding: 32 }}>
          <H2>{t('pricing.finalTitle')}</H2>
          <Prose style={{ margin: '0 auto' }}>
            <p>{t('pricing.finalLead')}</p>
          </Prose>
          <ButtonRow style={{ justifyContent: 'center' }}>
            <ButtonLink to={paths.checkout(lang, 'annual')}>{t('pricing.goPremium')}</ButtonLink>
          </ButtonRow>
          <Muted style={{ marginTop: 10 }}>
            <Link to={paths.map(lang)} style={{ color: 'var(--fg-3)' }}>
              {t('pricing.keepFree')}
            </Link>
          </Muted>
        </Card>
      </Section>
    </Page>
  )
}
