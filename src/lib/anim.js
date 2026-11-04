import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from './gsapSetup'
import { prefersReducedMotion, isCoarsePointer } from './env'

/* ------------------------------------------------------------------ *
 * Word splitting
 * Each word is wrapped in an overflow-hidden mask so it can rise from
 * behind its own baseline. Words are tagged with the visual line they
 * landed on, which lets us stagger by line without wrapping DOM ranges
 * across inline elements (<em>, <a>) and breaking the markup.
 * ------------------------------------------------------------------ */

function wrapWords(node, collected) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      if (!child.textContent.trim()) return
      const frag = document.createDocumentFragment()
      child.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '))
          return
        }
        const mask = document.createElement('span')
        mask.className = 'w-mask'
        const inner = document.createElement('span')
        inner.className = 'w-in'
        inner.textContent = part
        mask.appendChild(inner)
        frag.appendChild(mask)
        collected.push(inner)
      })
      node.replaceChild(frag, child)
    } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains('w-mask')) {
      wrapWords(child, collected)
    }
  })
}

export function splitWords(el) {
  if (!el) return { words: [], lines: [] }
  if (el.dataset.split !== 'done') {
    const collected = []
    wrapWords(el, collected)
    el.dataset.split = 'done'
    el._words = collected
  }
  const words = el._words || []
  // group by visual line
  let last = null
  let line = -1
  const lines = words.map((w) => {
    const top = Math.round(w.parentElement.offsetTop)
    if (last === null || Math.abs(top - last) > 4) {
      line += 1
      last = top
    }
    return line
  })
  return { words, lines }
}

/** Rise-from-baseline headline animation, staggered line by line. */
export function animateHeadline(el, { trigger, start = 'top 85%', delay = 0, scrub = false } = {}) {
  if (!el) return null
  const { words, lines } = splitWords(el)
  if (!words.length) return null

  if (prefersReducedMotion()) {
    gsap.set(words, { yPercent: 0, opacity: 1 })
    return null
  }

  gsap.set(words, { yPercent: 118, opacity: 1 })
  return gsap.to(words, {
    yPercent: 0,
    duration: 1.15,
    ease: 'expo.out',
    delay,
    stagger: (i) => lines[i] * 0.085 + (i - lines.indexOf(lines[i])) * 0.012,
    scrollTrigger: trigger === false ? undefined : { trigger: trigger || el, start, once: !scrub },
  })
}

/* ------------------------------------------------------------------ *
 * Scoped reveal — anything tagged [data-reveal] inside the scope fades
 * and lifts once. [data-reveal="rule"] draws a hairline instead.
 * ------------------------------------------------------------------ */

export function useRevealScope(deps = []) {
  const scope = useRef(null)

  useEffect(() => {
    const root = scope.current
    if (!root) return
    const reduced = prefersReducedMotion()

    const ctx = gsap.context(() => {
      root.querySelectorAll('[data-reveal]').forEach((el) => {
        const kind = el.dataset.reveal
        const d = parseFloat(el.dataset.revealDelay || 0)
        const trigger = { trigger: el, start: 'top 88%', once: true }

        if (reduced) {
          gsap.set(el, { clearProps: 'all' })
          return
        }

        if (kind === 'rule') {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            { scaleX: 1, duration: 1.5, ease: 'expo.out', delay: d, scrollTrigger: trigger },
          )
        } else if (kind === 'clip') {
          gsap.fromTo(
            el,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 1.5,
              ease: 'expo.out',
              delay: d,
              scrollTrigger: trigger,
            },
          )
          const media = el.querySelector('img, canvas, .figure__inner')
          if (media) {
            gsap.fromTo(
              media,
              { scale: 1.24 },
              { scale: 1, duration: 1.8, ease: 'expo.out', delay: d, scrollTrigger: trigger },
            )
          }
        } else if (kind === 'stagger') {
          gsap.fromTo(
            Array.from(el.children),
            { y: 26, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: 'power3.out',
              stagger: 0.07,
              delay: d,
              scrollTrigger: trigger,
            },
          )
        } else {
          gsap.fromTo(
            el,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: d, scrollTrigger: trigger },
          )
        }
      })
    }, root)

    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}

/* ---------------------------------------------------------- parallax */

/**
 * Scrub an element through `distance` px of counter-movement as its
 * container crosses the viewport. Negative = moves slower than the page.
 */
export function useParallax(distance = 120, opts = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: opts.from ?? -distance / 10 },
        {
          yPercent: opts.to ?? distance / 10,
          ease: 'none',
          scrollTrigger: {
            trigger: opts.trigger || el.parentElement,
            start: 'top bottom',
            end: 'bottom top',
            scrub: opts.scrub ?? 1,
          },
        },
      )
    })
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distance])
  return ref
}

/* ---------------------------------------------------------- magnetic */

/** Pointer-attracted element. Ignored on touch and reduced motion. */
export function useMagnetic(strength = 0.35) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || isCoarsePointer() || prefersReducedMotion()) return

    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })

    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const onLeave = () => {
      xTo(0)
      yTo(0)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])
  return ref
}

/* ------------------------------------------------- in-view (for 3D) */

/** Mount-gate for expensive children: true once the node nears the viewport. */
export function useInView(margin = '400px') {
  const ref = useRef(null)
  const seen = useRef(false)
  const [state, setState] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen.current) return
    if (!('IntersectionObserver' in window)) {
      setState(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          seen.current = true
          setState(true)
          io.disconnect()
        }
      },
      { rootMargin: margin },
    )
    io.observe(el)
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [margin])

  return [ref, state]
}
