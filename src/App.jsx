import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsapSetup'
import SmoothScroll from './lib/SmoothScroll'
import { useContent } from './content/ContentProvider'
import Preloader from './components/Preloader'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Water from './components/Water'
import Garden from './components/Garden'
import Gallery from './components/Gallery'
import Visit from './components/Visit'
import Footer from './components/Footer'

export default function App() {
  const { c, t } = useContent()
  const [ready, setReady] = useState(false)
  const onDone = useCallback(() => setReady(true), [])

  /* One measurement pass once the panel is gone and the fonts have settled,
     instead of every section refreshing on its own. */
  useEffect(() => {
    if (!ready) return
    const run = () => ScrollTrigger.refresh()
    const id = setTimeout(run, 120)
    document.fonts?.ready.then(run).catch(() => {})
    window.addEventListener('load', run, { once: true })
    return () => clearTimeout(id)
  }, [ready])

  return (
    <SmoothScroll>
      <a className="skip-link label" href="#main">
        {t(c.ui.skip)}
      </a>
      <Preloader onDone={onDone} />
      <Nav ready={ready} />
      <main id="main">
        <Hero ready={ready} />
        <Water />
        <Garden />
        <Gallery />
        <Visit />
      </main>
      <Footer />
    </SmoothScroll>
  )
}
