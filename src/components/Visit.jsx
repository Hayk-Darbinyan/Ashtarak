import { useState } from 'react'
import { useMagnetic, useParallax, useRevealScope } from '../lib/anim'
import { src, srcSet } from '../lib/images'
import { useContent } from '../content/ContentProvider'
import { lines } from '../content/i18n'
import Headline from './ui/Headline'
import './visit.css'

export default function Visit() {
  const { c, t } = useContent()
  const v = c.visit
  const f = v.form
  const scope = useRevealScope()
  const bed = useParallax(-90)
  const submit = useMagnetic(0.22)
  const [sent, setSent] = useState(false)

  const fields = [
    { name: 'name', label: t(f.name), type: 'text', autoComplete: 'name', placeholder: t(f.namePlaceholder) },
    { name: 'date', label: t(f.date), type: 'date', autoComplete: 'off', placeholder: '' },
    { name: 'party', label: t(f.party), type: 'number', autoComplete: 'off', placeholder: '2' },
    { name: 'email', label: t(f.email), type: 'email', autoComplete: 'email', placeholder: 'you@' },
  ]

  const onSubmit = (e) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section
      id="visit"
      className="section section--dark visit grain"
      ref={scope}
      data-nav-theme="dark"
      aria-labelledby="visit-title"
    >
      <div className="visit__bed" aria-hidden="true">
        <div ref={bed} className="visit__bed-in">
          <img
            src={src(v.image, 1800)}
            srcSet={srcSet(v.image)}
            sizes="100vw"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="shell visit__inner">
        <header className="sec-head">
          <span className="sec-head__index label">06 — {t(v.label)}</span>
          <span className="label label--muted">{t(c.brand.season)}</span>
        </header>

        <Headline id="visit-title" className="visit__title display d-lg" text={t(v.title)} />

        <div className="visit__grid grid12">
          <div className="visit__form-wrap">
            {sent ? (
              <div className="visit__sent" role="status">
                <p className="display d-sm">{t(v.sent.title)}</p>
                <p className="body">{t(v.sent.body)}</p>
                <button className="ilink" onClick={() => setSent(false)}>
                  {t(v.sent.again)}
                  <span className="ilink__arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            ) : (
              <form className="visit__form" onSubmit={onSubmit} noValidate>
                <div className="visit__fields">
                  {fields.map((fl) => (
                    <p className="field" key={fl.name}>
                      <label className="label label--muted" htmlFor={`f-${fl.name}`}>
                        {fl.label}
                      </label>
                      <input
                        id={`f-${fl.name}`}
                        className="field__input"
                        name={fl.name}
                        type={fl.type}
                        placeholder={fl.placeholder}
                        autoComplete={fl.autoComplete}
                        min={fl.type === 'number' ? 1 : undefined}
                        required={fl.name !== 'party'}
                      />
                      <span className="field__rule" aria-hidden="true" />
                    </p>
                  ))}
                </div>

                <div className="visit__actions">
                  <button className="visit__submit" type="submit" ref={submit} data-cursor={t(c.ui.send)}>
                    <span className="label">{t(f.submit)}</span>
                    <span className="visit__submit-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                  <p className="label label--muted visit__fineprint">{t(f.fineprint)}</p>
                </div>
              </form>
            )}
          </div>

          <address className="visit__contact">
            <div className="visit__block" data-reveal>
              <span className="label label--muted">{t(v.where)}</span>
              {lines(t(c.brand.address)).map((line) => (
                <span className="visit__line" key={line}>
                  {line}
                </span>
              ))}
              <span className="label label--muted visit__coords">{c.brand.coords}</span>
            </div>

            <div className="visit__block" data-reveal data-reveal-delay="0.08">
              <span className="label label--muted">{t(v.hoursLabel)}</span>
              <span className="visit__line">{c.brand.hours}</span>
              <span className="visit__line">{t(c.brand.season)}</span>
              <span className="label label--muted">{t(v.hoursNote)}</span>
            </div>

            <div className="visit__block" data-reveal data-reveal-delay="0.16">
              <span className="label label--muted">{t(v.speak)}</span>
              <a className="visit__line visit__link" href={`tel:${c.brand.phone.replace(/\s/g, '')}`}>
                {c.brand.phone}
              </a>
              <a className="visit__line visit__link" href={`mailto:${c.brand.email}`}>
                {c.brand.email}
              </a>
            </div>
          </address>
        </div>
      </div>
    </section>
  )
}
