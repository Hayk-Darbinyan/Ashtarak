import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsapSetup'
import { useInView, useRevealScope } from '../lib/anim'
import { canRender3D, prefersReducedMotion } from '../lib/env'
import { src, srcSet } from '../lib/images'
import { useContent } from '../content/ContentProvider'
import Headline from './ui/Headline'
import CountUp from './ui/CountUp'
import './water.css'

const WaterPanel = lazy(() => import('./three/WaterPanel'))

export default function Water() {
  const { c, t } = useContent()
  const w = c.water
  const scope = useRevealScope()
  const panel = useRef(null)
  const [hostRef, near] = useInView('300px')
  const [webgl, setWebgl] = useState(false)
  const [awake, setAwake] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => setWebgl(canRender3D()), [])

  /* render the canvas only while the panel is on screen */
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: panel.current,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => setAwake(self.isActive),
    })
    return () => st.kill()
  }, [])

  /* the panel grows out of the page as it arrives */
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel.current,
        { clipPath: 'inset(14% 12% 14% 12%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          scrollTrigger: { trigger: panel.current, start: 'top 92%', end: 'top 32%', scrub: 0.8 },
        },
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section
      id="water"
      className="section section--dark water"
      ref={scope}
      data-nav-theme="dark"
      aria-labelledby="water-title"
    >
      <div className="shell">
        <header className="sec-head">
          <span className="sec-head__index label">02 — {t(w.label)}</span>
          <span className="label label--muted">{t(w.aside)}</span>
        </header>
      </div>

      <div className="water__bleed" ref={hostRef}>
        <div
          className="water__panel"
          ref={panel}
          data-cursor={t(c.ui.touch)}
          onPointerMove={() => !touched && setTouched(true)}
        >
          <img
            className="water__bed"
            src={src(w.image, 1800)}
            srcSet={srcSet(w.image)}
            sizes="100vw"
            alt={t(w.image.alt)}
            loading="lazy"
            decoding="async"
          />

          <div className="water__overlay">
            <Headline id="water-title" className="water__title display d-lg" text={t(w.title)} />
          </div>
        </div>
      </div>

      <div className="shell">
        <div className="water__foot grid12">
          <div className="water__copy">
            <p className="body-lg" data-reveal>
              {t(w.lead)}
            </p>
            <p className="body" data-reveal data-reveal-delay="0.08">
              {t(w.body)}
            </p>
          </div>

          <dl className="water__stats">
            {w.stats.map((s, i) => (
              <div className="water__stat" key={i} data-reveal>
                <dt className="water__stat-v display">
                  <CountUp value={s.value} />
                  <span className="water__stat-u">{t(s.unit)}</span>
                </dt>
                <dd className="label label--muted">{t(s.label)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
