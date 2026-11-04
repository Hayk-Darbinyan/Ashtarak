import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsapSetup'
import { prefersReducedMotion } from '../lib/env'
import { useContent } from '../content/ContentProvider'
import './preloader.css'

/**
 * Holds the page for one breath: a count, a filling rule, then the panel
 * leaves in three slats. Never longer than 2.2s, and skipped entirely for
 * reduced-motion visitors.
 */
export default function Preloader({ onDone }) {
  const { c, t } = useContent()
  const root = useRef(null)
  const slats = useRef([])
  const [count, setCount] = useState(0)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setGone(true)
      onDone?.()
      return
    }

    document.body.classList.add('is-locked')
    const state = { v: 0 }

    const tl = gsap.timeline()

    tl.fromTo(
      '.pre__brand .w-in, .pre__meta',
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06 },
      0.05,
    )
      .to(
        state,
        {
          v: 100,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: () => setCount(Math.round(state.v)),
        },
        0,
      )
      .fromTo('.pre__rule-fill', { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
      .to('.pre__inner', { opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.45)
      .to(
        slats.current,
        {
          yPercent: -100,
          duration: 1.05,
          ease: 'expo.inOut',
          stagger: 0.07,
          onComplete: () => {
            document.body.classList.remove('is-locked')
            setGone(true)
          },
        },
        1.5,
      )
      .add(() => onDone?.(), 1.85)

    /* rAF is throttled in background tabs, which would strand the panel on
       screen. Wall-clock safety net: release the page no matter what. */
    const bail = setTimeout(() => {
      tl.progress(1)
      document.body.classList.remove('is-locked')
      setGone(true)
      onDone?.()
    }, 4200)

    return () => {
      clearTimeout(bail)
      tl.kill()
      document.body.classList.remove('is-locked')
    }
  }, [onDone])

  if (gone) return null

  return (
    <div className="pre" ref={root} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="pre__slat" ref={(el) => (slats.current[i] = el)} />
      ))}
      <div className="pre__inner">
        <div className="pre__brand display d-md">
          <span className="w-mask">
            <span className="w-in">{c.brand.name.toUpperCase()}</span>
          </span>
        </div>
        <div className="pre__foot">
          <span className="pre__meta label">
            {t(c.brand.kind)} — {t(c.brand.place)}
          </span>
          <span className="pre__meta label pre__count">{String(count).padStart(3, '0')}</span>
        </div>
        <div className="pre__rule">
          <div className="pre__rule-fill" />
        </div>
      </div>
    </div>
  )
}
