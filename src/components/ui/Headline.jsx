import { useEffect, useMemo, useRef } from 'react'
import SplitText from './SplitText'
import { animateHeadline } from '../../lib/anim'
import { rich } from '../../content/i18n'

/**
 * A display headline that rises word by word.
 * `text` uses the editor syntax (new line, *accent*). Changing it — a new
 * language, an edit in the admin — mounts a fresh element and replays the
 * rise, because the old words were rewritten by the splitter.
 *
 * play   — hold the animation until true (the hero waits for the preloader)
 * scroll — tie it to the element entering the viewport; false plays at once
 */
export default function Headline({
  as = 'h2',
  text,
  id,
  className,
  play = true,
  scroll = true,
  delay = 0,
}) {
  const ref = useRef(null)
  const html = useMemo(() => rich(text), [text])

  useEffect(() => {
    if (!play) return
    const tween = animateHeadline(ref.current, { trigger: scroll ? undefined : false, delay })
    return () => {
      tween?.scrollTrigger?.kill()
      tween?.kill()
    }
  }, [html, play, scroll, delay])

  return <SplitText key={html} as={as} id={id} className={className} innerRef={ref} html={html} />
}
