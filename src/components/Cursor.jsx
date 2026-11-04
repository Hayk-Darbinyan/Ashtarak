import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsapSetup'
import { isCoarsePointer, prefersReducedMotion } from '../lib/env'
import './cursor.css'

/**
 * Two bodies with different inertia: a hard dot that tracks the pointer and
 * a slower ring that lags behind it. Elements carrying data-cursor swell the
 * ring and borrow its label.
 */
export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (isCoarsePointer() || prefersReducedMotion()) return
    setEnabled(true)
    return () => document.documentElement.classList.remove('has-cursor')
  }, [])

  useEffect(() => {
    if (!enabled) return
    const d = dot.current
    const r = ring.current
    if (!d || !r) return

    gsap.set([d, r], { xPercent: -50, yPercent: -50, opacity: 0 })

    const dx = gsap.quickTo(d, 'x', { duration: 0.12, ease: 'power3.out' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.12, ease: 'power3.out' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3.out' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3.out' })

    let shown = false
    const onMove = (e) => {
      if (!shown) {
        shown = true
        document.documentElement.classList.add('has-cursor')
        gsap.to([d, r], { opacity: 1, duration: 0.4 })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }

    const setState = (el) => {
      const target = el?.closest?.('[data-cursor], a, button')
      if (!target) {
        gsap.to(r, { scale: 1, duration: 0.45, ease: 'power3.out' })
        gsap.to(d, { scale: 1, duration: 0.3 })
        setLabel('')
        return
      }
      const text = target.getAttribute('data-cursor') || ''
      setLabel(text)
      gsap.to(r, { scale: text ? 2.6 : 1.9, duration: 0.5, ease: 'power3.out' })
      gsap.to(d, { scale: text ? 0 : 0.4, duration: 0.35 })
    }

    const onOver = (e) => setState(e.target)
    const onDown = () => gsap.to(r, { scale: 0.85, duration: 0.2 })
    const onUp = (e) => setState(e.target)
    const onLeave = () => {
      shown = false
      document.documentElement.classList.remove('has-cursor')
      gsap.to([d, r], { opacity: 0, duration: 0.3 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerover', onOver)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span className="cursor__label">{label}</span>
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  )
}
