import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsapSetup'
import { useMagnetic } from '../lib/anim'
import { canRender3D, prefersReducedMotion } from '../lib/env'
import { useSmoothScroll } from '../lib/SmoothScroll'
import { src, srcSet } from '../lib/images'
import { useContent } from '../content/ContentProvider'
import Headline from './ui/Headline'
import './hero.css'

const WaterPanel = lazy(() => import('./three/WaterPanel'))

/** Local time at the garden, ticking. A small claim that the place is real. */
function LocalClock() {
  const [now, setNow] = useState('')
  useEffect(() => {
    const tick = () => {
      try {
        setNow(
          new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'Asia/Yerevan',
          }).format(new Date()),
        )
      } catch {
        setNow(new Date().toTimeString().slice(0, 8))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="hero__clock">{now}</span>
}

/** Circular seal: the string is fitted to the circumference whatever its length. */
function Seal({ text, lang }) {
  const R = 58
  const circumference = 2 * Math.PI * R
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <path id="heroRing" d={`M80,80 m-${R},0 a${R},${R} 0 1,1 ${R * 2},0 a${R},${R} 0 1,1 -${R * 2},0`} />
      </defs>
      <text className="hero__cta-text" textLength={circumference - 6} lengthAdjust="spacing">
        <textPath href="#heroRing" startOffset="0%">
          {text.toLocaleUpperCase(lang)}
        </textPath>
      </text>
    </svg>
  )
}

export default function Hero({ ready }) {
  const { c, t, lang } = useContent()
  const h = c.hero
  const root = useRef(null)
  const [webgl, setWebgl] = useState(false)
  const [awake, setAwake] = useState(true)
  const { scrollTo } = useSmoothScroll()
  const cta = useMagnetic(0.25)

  useEffect(() => {
    setWebgl(canRender3D())
  }, [])

  /* stop rendering the canvas once the hero has left */
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => setAwake(self.isActive),
    })
    return () => st.kill()
  }, [])

  /* load sequence — everything except the headline, which runs itself */
  useEffect(() => {
    if (!ready || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.15 })
        .fromTo('.hero__eyebrow', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0)
        .fromTo('.hero__rule', { scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: 'expo.out' }, 0.35)
        // .fromTo(
        //   '.hero__plate',
        //   { clipPath: 'inset(0% 0% 100% 0%)' },
        //   { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' },
        //   0.45,
        // )
        .fromTo('.hero__plate img', { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.45)
        .fromTo(
          '.hero__foot > *',
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, stagger: 0.09 },
          0.7,
        )
    }, root)
    return () => ctx.revert()
  }, [ready])

  /* the composition lifts and thins as you leave */
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.to('.hero__type', {
        yPercent: -22,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
      })
      gsap.to('.hero__plate', {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.8 },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const goVisit = (e) => {
    e?.preventDefault()
    scrollTo
      ? scrollTo('#visit', { duration: 1.9 })
      : document.getElementById('visit')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="top"
      className="hero"
      ref={root}
      data-nav-theme="dark"
      aria-label={`${c.brand.name} — ${t(c.brand.kind)}`}
    >
      {/* base layer: the photograph, always present */}
      <div className="hero__bed">
        <img
          src={src(h.image, 1800)}
          srcSet={srcSet(h.image)}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          fetchpriority="high"
          decoding="async"
        />
      </div>

      <div className="hero__veil" />

      <div className="hero__inner shell">
        <p className="hero__eyebrow label">
          <span>{t(c.brand.kind)}</span>
          <span className="hero__eyebrow-sep" aria-hidden="true" />
          <span>{t(c.brand.place)}</span>
          <span className="hero__eyebrow-sep" aria-hidden="true" />
          <span>
            {t(c.ui.est)} {c.brand.since}
          </span>
        </p>

        <div className="hero__type">
          <Headline
            as="h1"
            className="hero__title display d-xl"
            text={t(h.title)}
            play={ready}
            scroll={false}
            delay={0.1}
          />
        </div>

        {/* a portrait plate hung over the water — depth without a slideshow */}
        {/* {h.plate?.src && (
          <figure className="hero__plate">
            <img
              src={src(h.plate, 900)}
              srcSet={srcSet(h.plate, [480, 760, 1000])}
              sizes="(max-width: 860px) 40vw, 22vw"
              alt={t(h.plate.alt)}
              loading="eager"
              decoding="async"
            />
            <figcaption className="label">
              <span>{h.plateTime}</span>
              <span className="label--muted">{t(h.plateCaption)}</span>
            </figcaption>
          </figure>
        )} */}

        <div className="hero__rule" />

        <div className="hero__foot">
          <div className="hero__meta label">
            <LocalClock />
            <span className="label--muted">{t(c.ui.local)}</span>
            <span className="hero__dot" aria-hidden="true" />
            <span>{h.waterTemp}</span>
            <span className="label--muted">{t(c.ui.water)}</span>
          </div>

          <a href="#visit" className="hero__cta" ref={cta} data-cursor={t(c.nav.reserve)} onClick={goVisit}>
            <span className="hero__cta-ring" aria-hidden="true">
              <Seal lang={lang} text={`${t(h.seal)} · ${t(c.brand.season)} · `} />
            </span>
            <span className="hero__cta-arrow" aria-hidden="true">
              ↓
            </span>
            <span className="sr-only">{t(h.seal)}</span>
          </a>
        </div>
      </div>
    </section>
  )
}
