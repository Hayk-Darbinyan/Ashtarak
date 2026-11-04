import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsapSetup'
import { prefersReducedMotion } from '../../lib/env'

/**
 * A numeral that counts up the first time it is seen.
 * React renders the span empty and never owns its text, so the tween can
 * write to it freely without fighting reconciliation.
 */
export default function CountUp({ value, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const str = String(value ?? '')
    const end = parseFloat(str.replace(',', '.'))
    el.textContent = str
    if (!Number.isFinite(end) || prefersReducedMotion()) return

    const decimals = (str.split(/[.,]/)[1] || '').length
    const sep = str.includes(',') ? ',' : '.'
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: end,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onStart: () => (el.textContent = '0'),
      onUpdate: () => (el.textContent = obj.v.toFixed(decimals).replace('.', sep)),
    })
    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      el.textContent = str
    }
  }, [value])

  return <span ref={ref} className={className} />
}
