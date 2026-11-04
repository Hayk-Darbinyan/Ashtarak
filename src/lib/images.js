/**
 * Photographs come from the content document as { src, alt }.
 * `src` is either an Unsplash URL — resized on their CDN per breakpoint — or
 * anything else (an uploaded file under /uploads, another host), used as is.
 */

const isUnsplash = (url) => /^https:\/\/images\.unsplash\.com\//.test(url || '')

const srcOf = (photo) => (typeof photo === 'string' ? photo : photo?.src) || ''

export function src(photo, w = 1200, { q = 72 } = {}) {
  const url = srcOf(photo)
  if (!isUnsplash(url)) return url
  const base = url.split('?')[0]
  return `${base}?w=${w}&q=${q}&auto=format&fit=max`
}

/** Only CDN images get a width ladder; a single uploaded file has one size. */
export function srcSet(photo, widths = [640, 1000, 1400, 1920]) {
  const url = srcOf(photo)
  if (!isUnsplash(url)) return undefined
  return widths.map((w) => `${src(url, w)} ${w}w`).join(', ')
}
