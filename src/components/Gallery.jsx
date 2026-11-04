import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsapSetup'
import { useRevealScope } from '../lib/anim'
import { prefersReducedMotion } from '../lib/env'
import { useSmoothScroll } from '../lib/SmoothScroll'
import { src, srcSet } from '../lib/images'
import { useContent } from '../content/ContentProvider'
import { fill } from '../content/i18n'
import './gallery.css'

function Lightbox({ items, index, onClose, onStep }) {
  const { c, t } = useContent()
  const root = useRef(null)
  const frame = useRef(null)
  const { stop, start } = useSmoothScroll()
  const item = items[index]

  useEffect(() => {
    stop?.()
    document.body.classList.add('is-locked')
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    root.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('is-locked')
      start?.()
    }
  }, [onClose, onStep, stop, start])

  useEffect(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' })
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo(
      frame.current,
      { clipPath: 'inset(8% 12% 8% 12%)', scale: 1.06, opacity: 0.4 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out' },
    )
  }, [index])

  const pad = (n) => String(n).padStart(2, '0')

  return (
    <div
      className="lbox"
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${t(c.gallery.label)} — ${index + 1} / ${items.length}`}
      tabIndex={-1}
    >
      <button className="lbox__scrim" onClick={onClose} aria-label={t(c.ui.close)} />

      <figure className="lbox__frame" ref={frame}>
        <img
          src={src(item.image, 1800)}
          srcSet={srcSet(item.image, [900, 1400, 1800])}
          sizes="86vw"
          alt={t(item.image.alt)}
          decoding="async"
        />
      </figure>

      <div className="lbox__bar">
        <span className="label">
          {pad(index + 1)} / {pad(items.length)}
        </span>
        <span className="label label--muted lbox__cap">{t(item.caption)}</span>
        <div className="lbox__nav">
          <button className="label lbox__btn" onClick={() => onStep(-1)}>
            ← {t(c.ui.prev)}
          </button>
          <button className="label lbox__btn" onClick={() => onStep(1)}>
            {t(c.ui.next)} →
          </button>
          <button className="label lbox__btn" onClick={onClose}>
            {t(c.ui.close)}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Gallery() {
  const { c, t } = useContent()
  const items = c.gallery.items.filter((it) => it.image?.src)
  const scope = useRevealScope()
  const [open, setOpen] = useState(-1)
  const count = items.length

  const step = useCallback((d) => setOpen((i) => (i + d + count) % count), [count])
  const close = useCallback(() => setOpen(-1), [])

  return (
    <section
      id="gallery"
      className="section gallery"
      ref={scope}
      data-nav-theme="light"
      aria-labelledby="gallery-title"
    >
      <div className="shell">
        <header className="sec-head">
          <span className="sec-head__index label" id="gallery-title">
            05 — {t(c.gallery.label)}
          </span>
          <span className="label label--muted">{fill(t(c.gallery.aside), { n: count })}</span>
        </header>

        <div className="gallery__grid">
          {items.map((item, i) => (
            <button
              key={`${item.image.src}-${i}`}
              className="gallery__item"
              onClick={() => setOpen(i)}
              data-reveal="clip"
              data-cursor={t(c.ui.view)}
              aria-label={`${t(c.ui.view)}: ${t(item.caption)}`}
            >
              <span className="gallery__media" style={{ aspectRatio: item.ratio || '4 / 5' }}>
                <img
                  src={src(item.image, 900)}
                  srcSet={srcSet(item.image, [420, 700, 1000])}
                  sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw"
                  alt={t(item.image.alt)}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="gallery__cap label">
                <i>{String(i + 1).padStart(2, '0')}</i>
                {t(item.caption)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {open >= 0 && open < count && (
        <Lightbox items={items} index={open} onClose={close} onStep={step} />
      )}
    </section>
  )
}
