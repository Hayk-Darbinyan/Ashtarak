import { useContent } from '../../content/ContentProvider'
import { LANGS } from '../../content/i18n'
import './langswitch.css'

/** Three languages, set in their own scripts, the current one underlined. */
export default function LangSwitch({ className = '' }) {
  const { lang, setLang, t, c } = useContent()

  return (
    <div className={`lang ${className}`} role="group" aria-label={t(c.ui.language)}>
      {LANGS.map((l, i) => (
        <span key={l.code} className="lang__cell">
          {i > 0 && (
            <span className="lang__sep" aria-hidden="true">
              /
            </span>
          )}
          <button
            type="button"
            lang={l.code}
            className={`lang__btn label ${lang === l.code ? 'is-on' : ''}`}
            aria-pressed={lang === l.code}
            aria-label={l.name}
            onClick={() => setLang(l.code)}
          >
            {l.short}
          </button>
        </span>
      ))}
    </div>
  )
}
