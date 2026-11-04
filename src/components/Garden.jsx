import Figure from './ui/Figure'
import Headline from './ui/Headline'
import { useParallax, useRevealScope } from '../lib/anim'
import { useContent } from '../content/ContentProvider'
import './garden.css'

export default function Garden() {
  const { c, t } = useContent()
  const g = c.garden
  const scope = useRevealScope()
  const back = useParallax(-70)
  const mid = useParallax(160)
  const front = useParallax(-240)

  return (
    <section
      id="garden"
      className="section garden"
      ref={scope}
      data-nav-theme="light"
      aria-labelledby="garden-title"
    >
      <div className="shell">
        <header className="sec-head">
          <span className="sec-head__index label">03 — {t(g.label)}</span>
          <span className="label label--muted">{t(g.aside)}</span>
        </header>
      </div>

      <div className="garden__stage shell">
        <div className="garden__layer garden__layer--back">
          <div ref={back}>
            <Figure
              photo={g.imageBack}
              ratio="4 / 3"
              sizes="(max-width: 860px) 40vw, 26vw"
              className="garden__fig"
            />
          </div>
        </div>

        <Headline id="garden-title" className="garden__title display d-lg" text={t(g.title)} />

        <div className="garden__layer garden__layer--mid">
          <div ref={mid}>
            <Figure
              photo={g.imageMid}
              ratio="3 / 4"
              sizes="(max-width: 860px) 70vw, 40vw"
              caption={t(g.imageMidCaption)}
              meta={t(g.imageMidMeta)}
              className="garden__fig"
            />
          </div>
        </div>

        <div className="garden__layer garden__layer--front">
          <div ref={front}>
            <Figure
              photo={g.imageFront}
              ratio="1 / 1"
              sizes="(max-width: 860px) 45vw, 22vw"
              className="garden__fig"
            />
          </div>
        </div>

        <div className="garden__note" data-reveal>
          <p className="body">{t(g.body)}</p>
          <p className="label label--muted garden__note-tag">{t(g.tag)}</p>
        </div>
      </div>
    </section>
  )
}
