import { useState } from 'react'
import { src, srcSet } from '../../lib/images'
import { useContent } from '../../content/ContentProvider'

/**
 * A photograph with a stone-coloured plate underneath it.
 * The plate is part of the design, not a spinner: if the network never
 * delivers, the composition still reads as intended.
 */
export default function Figure({
  photo,
  ratio = '4 / 5',
  sizes = '(max-width: 860px) 92vw, 46vw',
  widths,
  className = '',
  dark = false,
  priority = false,
  caption,
  meta,
  children,
  style,
}) {
  const { t } = useContent()
  const url = photo?.src
  const [loadedUrl, setLoadedUrl] = useState(null)
  if (!url) return null

  return (
    <figure className={`figure-block ${className}`} style={style}>
      <div className={`figure ${dark ? 'figure--dark' : ''}`} style={{ aspectRatio: ratio }}>
        <img
          key={url}
          className={loadedUrl === url ? 'is-loaded' : ''}
          src={src(photo, 1400)}
          srcSet={srcSet(photo, widths)}
          sizes={sizes}
          alt={t(photo.alt)}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoadedUrl(url)}
          draggable="false"
        />
        {children}
      </div>
      {(caption || meta) && (
        <figcaption className="figure__cap label">
          {caption && <span>{caption}</span>}
          {meta && <span className="label--muted">{meta}</span>}
        </figcaption>
      )}
    </figure>
  )
}
