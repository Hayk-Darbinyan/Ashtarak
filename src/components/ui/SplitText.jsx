import { memo } from 'react'

/**
 * A headline whose DOM belongs to us, not to React.
 *
 * splitWords() rewrites the text nodes inside these elements into word
 * masks. If React also managed those children it would eventually try to
 * remove a node that is no longer its own and throw. Setting the markup
 * once, from a trusted string in our own source, hands the subtree over
 * cleanly — and memo keeps a parent re-render from touching it at all.
 */
const SplitText = memo(function SplitText({ as: Tag = 'h2', html, innerRef, ...rest }) {
  return <Tag ref={innerRef} {...rest} dangerouslySetInnerHTML={{ __html: html }} />
})

export default SplitText
