import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import styled from 'styled-components'
import { glass } from '../styles/shared'
import { FAQ_GROUPS, FAQ_ITEMS } from '../content/faq'
import { paths } from '../lib/routes'
import { Head } from '../lib/head'
import { breadcrumbList, faqPage } from '../lib/seo'
import { useLang } from '../layout/useLang'
import { Breadcrumbs } from '../layout/Breadcrumbs'
import { ButtonLink, ButtonRow, Card, Eyebrow, GhostA, GlassInput, H1, H2, Lead, Muted, Page, PageHead, Prose, Section } from '../styles/page'

const CONTACT = import.meta.env.VITE_CONTACT_EMAIL as string | undefined
const REPO = 'https://github.com/wpfsg/ankesi/issues'

const Item = styled.details`
  border-bottom: 1px solid var(--brd);

  &:last-child {
    border-bottom: 0;
  }

  summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 4px;
    font-size: 15.5px;
    font-weight: 600;
    cursor: pointer;
    list-style: none;
    scroll-margin-top: calc(var(--header-h, 72px) + 12px);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '';
    width: 8px;
    height: 8px;
    flex: none;
    margin-right: 4px;
    border-right: 2px solid var(--fg-3);
    border-bottom: 2px solid var(--fg-3);
    transform: rotate(45deg);
    transition: transform 160ms var(--spring);
  }

  &[open] summary::after {
    transform: rotate(-135deg);
  }

  > div {
    padding: 0 4px 16px;
  }
`

const Anchor = styled.a`
  color: var(--fg-3);
  font-size: 12px;
  text-decoration: none;
  margin-left: 8px;

  &:hover {
    color: var(--accent);
  }
`

const Jump = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0 8px;

  a {
    ${glass}
    height: 32px;
    padding: 0 13px;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    color: var(--fg-2);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  a:hover {
    color: var(--fg);
    background: var(--glass-bg-strong);
  }
`

/** Grouped accordion with deep-linkable anchors, filter box, FAQPage schema. */
export function FaqPage() {
  const { t } = useTranslation()
  const lang = useLang()
  const { hash } = useLocation()
  const [query, setQuery] = useState('')
  const crumbs = [{ name: t('nav.map'), to: paths.map(lang) }, { name: t('nav.faq') }]

  const items = useMemo(
    () => FAQ_ITEMS.map((i) => ({ ...i, q: t(`faq.items.${i.id}.q`), a: t(`faq.items.${i.id}.a`) })),
    [t],
  )

  // Open and scroll to the item named in the hash.
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(hash.slice(1))
    if (el instanceof HTMLDetailsElement) {
      el.open = true
      el.scrollIntoView({ block: 'start' })
    }
  }, [hash])

  const q = query.trim().toLowerCase()
  const visible = q ? items.filter((i) => `${i.q} ${i.a}`.toLowerCase().includes(q)) : items

  return (
    <Page $narrow>
      <Head
        title={t('seo.faq.title')}
        description={t('seo.faq.description')}
        path={paths.faq(lang)}
        lang={lang}
        jsonLd={[breadcrumbList(crumbs), faqPage(items)]}
      />
      <Breadcrumbs items={crumbs} />
      <PageHead>
        <Eyebrow>{t('faq.eyebrow')}</Eyebrow>
        <H1>{t('faq.title')}</H1>
        <Lead>{t('faq.lead')}</Lead>
        <Jump aria-label={t('faq.groupsLabel')}>
          {FAQ_GROUPS.map((g) => (
            <a key={g} href={`#${g}`}>
              {t(`faq.groups.${g}`)}
            </a>
          ))}
        </Jump>
        <GlassInput
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('faq.search')}
          aria-label={t('faq.search')}
          style={{ marginTop: 10 }}
        />
      </PageHead>

      {visible.length === 0 && <Muted>{t('faq.noResults')}</Muted>}

      {FAQ_GROUPS.map((g) => {
        const rows = visible.filter((i) => i.group === g)
        if (rows.length === 0) return null
        return (
          <Section key={g} id={g} style={{ marginTop: 28 }}>
            <H2>{t(`faq.groups.${g}`)}</H2>
            <Card style={{ padding: '4px 14px' }}>
              {rows.map((i) => (
                <Item key={i.id} id={i.id} open={q ? true : undefined}>
                  <summary>
                    <span>
                      {i.q}
                      <Anchor href={`#${i.id}`} aria-label={t('faq.link')} onClick={(e) => e.stopPropagation()}>
                        #
                      </Anchor>
                    </span>
                  </summary>
                  <div>
                    <Prose>
                      <p>{i.a}</p>
                    </Prose>
                  </div>
                </Item>
              ))}
            </Card>
          </Section>
        )
      })}

      <Section>
        <H2>{t('faq.stillTitle')}</H2>
        <Prose>
          <p>{t('faq.stillLead')}</p>
        </Prose>
        <ButtonRow>
          <ButtonLink to={paths.map(lang)}>{t('faq.stillMap')}</ButtonLink>
          <GhostA href={CONTACT ? `mailto:${CONTACT}` : REPO} target={CONTACT ? undefined : '_blank'} rel="noreferrer">
            {CONTACT ? t('faq.contact') : t('faq.contactGithub')}
          </GhostA>
        </ButtonRow>
      </Section>
    </Page>
  )
}
