/** Capability probes. Read once, cheap, SSR-safe-ish. */

export const isBrowser = typeof window !== 'undefined'

const flag = (key) =>
  isBrowser && new URLSearchParams(window.location.search).get(key)

/**
 * `?motion=off` renders the site in its resting state — every reveal already
 * resolved, nothing scrubbed. Useful for reviewing the composition on its own
 * terms, and for anyone who simply does not want the page to move.
 */
export const MOTION_OFF = () => flag('motion') === 'off'

export const prefersReducedMotion = () =>
  isBrowser && (MOTION_OFF() || window.matchMedia('(prefers-reduced-motion: reduce)').matches)

export const isCoarsePointer = () =>
  isBrowser && window.matchMedia('(pointer: coarse)').matches

/**
 * Should we spend the frame budget on WebGL?
 * Bail on reduced-motion, tiny viewports and low-memory devices — the
 * photographic fallback underneath every canvas is designed to stand alone.
 */
export const canRender3D = () => {
  if (!isBrowser) return false
  if (flag('gl') === 'off') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.innerWidth < 720) return false
  if (navigator.deviceMemory && navigator.deviceMemory < 4) return false
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Device-pixel-ratio ceiling so retina laptops don't render 4x pixels. */
export const dprRange = [1, 1.6]
