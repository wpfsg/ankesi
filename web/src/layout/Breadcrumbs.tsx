import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import styled from 'styled-components'
import type { Crumb } from '../lib/seo'

const Crumbs = styled.nav`
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--fg-3);

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  li + li::before {
    content: '/';
    margin-right: 6px;
    color: var(--fg-3);
    opacity: 0.6;
  }

  a {
    color: var(--fg-2);
    text-decoration: none;
  }

  a:hover {
    color: var(--fg);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  [aria-current='page'] {
    color: var(--fg-3);
  }
`

/** Visible trail; pair with breadcrumbList() in <Head jsonLd>. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { t } = useTranslation()
  return (
    <Crumbs aria-label={t('nav.breadcrumbs')}>
      <ol>
        {items.map((c, i) => (
          <li key={i}>
            {c.to && i < items.length - 1 ? <Link to={c.to}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
          </li>
        ))}
      </ol>
    </Crumbs>
  )
}
