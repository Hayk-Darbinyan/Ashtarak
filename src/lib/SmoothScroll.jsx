import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsapSetup'
import { prefersReducedMotion } from './env'

const ScrollCtx = createContext(null)

/** `const { scrollTo, stop, start } = useSmoothScroll()` */
export const useSmoothScroll = () => useContext(ScrollCtx) ?? {}

/**
 * Lenis drives the page; GSAP's ticker drives Lenis; ScrollTrigger listens to
 * Lenis. One clock, so scrubbed timelines never fight the smoothing.
 */
export default function SmoothScroll({ children }) {
  const lenisRef = useRef(null)
  const [api, setApi] = useState({})

  useEffect(() => {
    if (prefersReducedMotion()) {
      setApi({
        scrollTo: (t) => {
          const el = typeof t === 'string' ? document.querySelector(t) : t
          el?.scrollIntoView({ behavior: 'auto', block: 'start' })
        },
        stop: () => {},
        start: () => {},
      })
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      lerp: undefined,
    })
    lenisRef.current = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(250, 24)

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: (v) => (v !== undefined ? lenis.scrollTo(v, { immediate: true }) : lenis.scroll),
    })

    setApi({
      lenis,
      scrollTo: (target, opts) => lenis.scrollTo(target, { offset: 0, duration: 1.4, ...opts }),
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    })

    const onResize = () => ScrollTrigger.refresh()
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <ScrollCtx.Provider value={api}>{children}</ScrollCtx.Provider>
}
