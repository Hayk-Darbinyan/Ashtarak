export const LANGS = [
  { code: 'hy', short: 'Հայ', name: 'Հայերեն' },
  { code: 'ru', short: 'Рус', name: 'Русский' },
  { code: 'en', short: 'Eng', name: 'English' },
]

export const LANG_CODES = LANGS.map((l) => l.code)
export const DEFAULT_LANG = 'hy'

/** A translatable field is an object whose keys are language codes. */
export const isI18n = (v) =>
  !!v &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  Object.keys(v).length > 0 &&
  Object.keys(v).every((k) => LANG_CODES.includes(k))

/**
 * Resolve a field for a language. Missing translations fall back to English,
 * then Armenian, so an untranslated field shows *something* rather than a gap.
 */
export function pick(value, lang) {
  if (value == null) return ''
  if (!isI18n(value)) return value
  return value[lang] || value.en || value.hy || value.ru || ''
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Headline markup, deliberately tiny so editors never touch HTML:
 *   new line  -> line break
 *   *word*    -> italic accent
 * Everything else is escaped, so nothing typed in the admin can inject markup.
 */
export function rich(text) {
  return escapeHtml(text || '')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\r?\n/g, ' <br /> ')
}

export const lines = (text) => String(text || '').split(/\r?\n/).filter(Boolean)

/** "{n} frames" style templates. */
export const fill = (text, vars) =>
  String(text || '').replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`))
