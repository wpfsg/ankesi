import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Spot, SpotResult } from '../types'
import { LANGS, setLang, type Lang } from '../i18n'
import { bandOf } from '../lib/scoring'

interface Props {
  spots: Spot[]
  results: Record<string, SpotResult>
  onSelect: (id: string) => void
}

export function SearchPill({ spots, results, onSelect }: Props) {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language === 'en' ? 'en' : 'ka') as Lang
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return spots
      .filter((s) => {
        const region = t(`region.${s.region}`).toLowerCase()
        const type = t(`type.${s.type}`).toLowerCase()
        return (
          s.nameKa.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          region.includes(q) ||
          type.includes(q)
        )
      })
      .slice(0, 8)
  }, [query, spots, t])

  const showResults = focused && query.trim().length > 0

  return (
    <>
      <div className="pill glass">
        <svg className="pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder={t('search.placeholder')}
          aria-label={t('search.placeholder')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <div className="langchip" role="group" aria-label="language">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}>
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </div>

      {showResults && (
        <div className="results glass" role="listbox">
          {matches.length === 0 && <div className="result muted">{t('search.noResults')}</div>}
          {matches.map((s) => {
            const score = results[s.id]?.hours[0]?.score
            return (
              <button
                key={s.id}
                type="button"
                className="result"
                role="option"
                aria-selected={false}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(s.id)
                  setQuery('')
                  setFocused(false)
                }}
              >
                <span className="minibubble" data-band={bandOf(score)}>
                  {score ?? '·'}
                </span>
                <span className="result-name">
                  {lang === 'ka' ? s.nameKa : s.nameEn}
                  <small>
                    {t(`type.${s.type}`)} · {t(`region.${s.region}`)}
                  </small>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
