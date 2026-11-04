import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsapSetup'
import { useSmoothScroll } from '../lib/SmoothScroll'
import { useMagnetic } from '../lib/anim'
import { prefersReducedMotion } from '../lib/env'
import { useContent } from '../content/ContentProvider'
import { lines } from '../content/i18n'
import LangSwitch from './ui/LangSwitch'
import './nav.css'

export default function Nav({ ready }) {
  const { c, t } = useContent()
  const items = c.nav.items.map((item, i) => ({
    id: item.id,
    label: t(item.label),
    index: String(i + 1).padStart(2, '0'),
  }))
  const [onDark, setOnDark] = useState(true)
  const [open, setOpen] = useState(false)
  const bar = useRef(null)
  const menu = useRef(null)
  const burger = useRef(null)
  const { scrollTo, stop, start } = useSmoothScroll()
  const cta = useMagnetic(0.3)

  /* entrance, after the preloader clears */
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return
    gsap.fromTo(
      bar.current?.querySelectorAll('[data-nav-item]') || [],
      { y: -18, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.06, delay: 0.15 },
    )
  }, [ready])

  /* the bar borrows the colour of whatever section is under it */
  useEffect(() => {
    const triggers = []
    document.querySelectorAll('[data-nav-theme]').forEach((el) => {
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: 'top 56px',
          end: 'bottom 56px',
          onToggle: (self) => {
            if (self.isActive) setOnDark(el.dataset.navTheme === 'dark')
          },
        }),
      )
    })
    return () => triggers.forEach((t) => t.kill())
  }, [])

  /* fullscreen menu */
  useEffect(() => {
    const el = menu.current
    if (!el) return
    const items = el.querySelectorAll('[data-menu-item]')
    // keep the closed menu out of the tab order as well as out of the view
    el.inert = !open
    if (open) {
      stop?.()
      gsap.set(el, { pointerEvents: 'auto' })
      gsap
        .timeline({ onComplete: () => el.querySelector('a')?.focus() })
        .to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'expo.inOut' })
        .fromTo(
          items,
          { yPercent: 108, opacity: 0 },
          { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.055 },
          0.25,
        )
    } else {
      if (el.contains(document.activeElement)) burger.current?.focus()
      gsap.to(el, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 0.7,
        ease: 'expo.inOut',
        onComplete: () => {
          gsap.set(el, { pointerEvents: 'none' })
          start?.()
        },
      })
    }
  }, [open, stop, start])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    const target = document.getElementById(id)
    if (!target) return
    if (scrollTo) scrollTo(target, { offset: -2, duration: 1.6 })
    else target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header
        ref={bar}
        className={`nav ${onDark ? 'nav--dark' : 'nav--light'}`}
      >
        <a
          href="#top"
          className="nav__brand"
          data-nav-item
          onClick={(e) => {
            e.preventDefault()
            scrollTo ? scrollTo(0, { duration: 1.6 }) : window.scrollTo(0, 0)
          }}
        >
          <span className="nav__mark">{c.brand.name.toUpperCase()}</span>
          <span className="nav__kind label label--muted">{t(c.brand.kind)}</span>
        </a>

        <nav className="nav__links" aria-label={t(c.footer.sectionsLabel)}>
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="nav__link label"
              data-nav-item
              onClick={(e) => go(e, item.id)}
            >
              <span className="nav__link-idx label--muted">{item.index}</span>
              <span className="nav__link-txt">
                <span>{item.label}</span>
                <span aria-hidden="true">{item.label}</span>
              </span>
            </a>
          ))}
        </nav>

        <div className="nav__right" data-nav-item>
          <LangSwitch className="nav__lang" />
          <a
            href="#visit"
            ref={cta}
            className="nav__cta"
            onClick={(e) => go(e, 'visit')}
            data-cursor={t(c.nav.reserve)}
          >
            <span className="nav__cta-in label">{t(c.nav.reserve)}</span>
          </a>
          <button
            className="nav__burger"
            ref={burger}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t(c.ui.menuClose) : t(c.ui.menuOpen)}</span>
            <span className={`nav__burger-ico ${open ? 'is-open' : ''}`}>
              <i />
              <i />
            </span>
          </button>
        </div>
      </header>

      <div id="site-menu" className="menu" ref={menu} aria-hidden={!open}>
        <div className="menu__grid shell">
          <ul className="menu__list">
            {items.map((item) => (
              <li key={item.id} className="menu__item">
                <span className="w-mask" style={{ display: 'block' }}>
                  <a
                    href={`#${item.id}`}
                    data-menu-item
                    className="menu__link display d-lg"
                    onClick={(e) => go(e, item.id)}
                  >
                    <em className="menu__idx label">{item.index}</em>
                    {item.label}
                  </a>
                </span>
              </li>
            ))}
          </ul>
          <div className="menu__aside">
            <div data-menu-item>
              <LangSwitch className="menu__lang" />
            </div>
            <p className="label label--muted" data-menu-item>
              {lines(t(c.brand.address)).join(' · ')}
            </p>
            <p className="label" data-menu-item>
              {c.brand.phone}
            </p>
            <p className="label" data-menu-item>
              {c.brand.email}
            </p>
            <p className="label label--muted" data-menu-item>
              {t(c.brand.season)} — {c.brand.hours}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
