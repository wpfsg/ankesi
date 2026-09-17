import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { planById } from '../content/pricing'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { fmtGel } from '../lib/format'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { NotFoundPage } from './NotFoundPage'
import { Card, Eyebrow, Facts, GhostLink, GlassInput, H1, H2, Lead, Muted, Page, PageHead, PrimaryButton, Prose, Section } from '../styles/page'

const KEY = 'ankesi.premium.waitlist'

/** Stub checkout: no payments yet. Shows the chosen plan and takes an
 *  email for the launch waitlist. */
export function CheckoutPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { plan: planId } = useParams()
  const plan = planById(planId)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  if (!plan) return <NotFoundPage />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    try {
      const list = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[]
      list.push({ email, plan: plan.id, lang, at: new Date().toISOString() })
      localStorage.setItem(KEY, JSON.stringify(list))
    } catch {
      /* storage unavailable */
    }
    setDone(true)
  }

  const crumbs = [
    { name: t('nav.map'), to: paths.map(lang) },
    { name: t('nav.pricing'), to: paths.pricing(lang) },
    { name: t('checkout.title') },
  ]

  return (
    <Page $narrow>
      <Head title={t('checkout.title')} description={t('checkout.lead')} path={paths.checkout(lang, plan.id)} lang={lang} noindex />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>{t('checkout.eyebrow')}</Eyebrow>
        <H1>{t('checkout.title')}</H1>
        <Lead>{t('checkout.lead')}</Lead>
      </PageHead>

      <Card>
        <H2 style={{ fontSize: 18 }}>{t('checkout.plan')}</H2>
        <Facts>
          <dt>{t('pricing.feature')}</dt>
          <dd>{t(`pricing.plans.${plan.id}.name`)}</dd>
          <dt>{t('checkout.price')}</dt>
          <dd>
            {fmtGel(plan.priceGel, lang)} / {t(`pricing.period.${plan.period}`)}
          </dd>
        </Facts>
      </Card>

      <Section style={{ marginTop: 24 }}>
        <Card>
          {done ? (
            <Prose>
              <p>
                <strong>{t('checkout.sentTitle')}</strong>
              </p>
              <p>{t('checkout.sent')}</p>
            </Prose>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Prose>
                <p>{t('checkout.notify')}</p>
              </Prose>
              <GlassInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('checkout.email')}
                aria-label={t('checkout.email')}
                autoComplete="email"
              />
              <PrimaryButton type="submit">{t('checkout.submit')}</PrimaryButton>
              <Muted>{t('checkout.privacy')}</Muted>
            </form>
          )}
        </Card>
        <div style={{ marginTop: 16 }}>
          <GhostLink to={paths.pricing(lang)}>{t('checkout.back')}</GhostLink>
        </div>
      </Section>
    </Page>
  )
}
