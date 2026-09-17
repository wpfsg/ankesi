import { useParams } from 'react-router'
import { DEFAULT_LANG, isLang, type Lang } from '../i18n'

/** Language from the :lang route segment, Georgian when absent. */
export function useLang(): Lang {
  const { lang } = useParams()
  return isLang(lang) ? lang : DEFAULT_LANG
}
