import { useRevealScope } from '../lib/anim'
import { useSmoothScroll } from '../lib/SmoothScroll'
import { useContent } from '../content/ContentProvider'
import { lines } from '../content/i18n'
import './footer.css'

export default function Footer() {
  const { c, t } = useContent()
  const f = c.footer
  const scope = useRevealScope()
  const { scrollTo } = useSmoothScroll()

  const jump = (e, href) => {
    if (!href?.startsWith('#')) return
    e.preventDefault()
    const el = document.getElementById(href.slice(1))
    if (!el) return
    scrollTo ? scrollTo(el, { duration: 1.5 }) : el.scrollIntoView()
  }

  return (
    <footer className="foot" ref={scope} data-nav-theme="dark">
      <div className="shell">
        <div className="foot__top grid12">
          <div className="foot__col foot__col--wide" data-reveal>
            <span className="label label--muted">{t(f.gardenLabel)}</span>
            <p className="foot__blurb">{t(f.blurb)}</p>
          </div>

          <nav className="foot__col" aria-label={t(f.sectionsLabel)}>
            <span className="label label--muted">{t(f.sectionsLabel)}</span>
            <ul>
              {c.nav.items.map((n) => (
                <li key={n.id}>
                  <a href={`#${n.id}`} className="foot__link" onClick={(e) => jump(e, `#${n.id}`)}>
                    {t(n.label)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="foot__col">
            <span className="label label--muted">{t(f.reachLabel)}</span>
            <ul>
              <li>
                <a className="foot__link" href={`tel:${c.brand.phone.replace(/\s/g, '')}`}>
                  {c.brand.phone}
                </a>
              </li>
              <li>
                <a className="foot__link" href={`mailto:${c.brand.email}`}>
                  {c.brand.email}
                </a>
              </li>
              {lines(t(c.brand.address))
                .slice(0, 2)
                .map((line) => (
                  <li className="foot__muted" key={line}>
                    {line}
                  </li>
                ))}
            </ul>
          </div>
        </div>

        <div className="foot__markwrap">
          <p className="foot__mark display" aria-label={c.brand.name}>
            {c.brand.name
              .toUpperCase()
              .split('')
              .map((ch, i) => (
                <span key={i} className="foot__mark-l" aria-hidden="true">
                  {ch}
                </span>
              ))}
          </p>
        </div>

        <div className="foot__base">
          <span className="label label--muted">
            © {new Date().getFullYear()} {c.brand.name} {t(c.brand.kind)}
          </span>
          <span className="label label--muted foot__base-mid">
            {c.brand.coords} · {t(c.brand.altitude)}
          </span>
          <button
            className="label foot__top-link"
            onClick={() => (scrollTo ? scrollTo(0, { duration: 1.9 }) : window.scrollTo(0, 0))}
          >
            {t(f.back)}
          </button>
        </div>
      </div>
    </footer>
  )
}
