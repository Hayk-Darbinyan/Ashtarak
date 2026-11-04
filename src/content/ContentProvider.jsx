import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ScrollTrigger } from '../lib/gsapSetup'
import { DEFAULT_LANG, LANG_CODES, pick } from './i18n'
import fallbackContent from './default.json'

const Ctx = createContext(null)

/** `const { c, t, lang, setLang } = useContent()` */
export const useContent = () => useContext(Ctx)

const STORAGE_KEY = 'hortus.lang'

function initialLang() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (LANG_CODES.includes(fromUrl)) return fromUrl
    const stored = localStorage.getItem(STORAGE_KEY)
    if (LANG_CODES.includes(stored)) return stored
  } catch {
    /* storage can be unavailable; fall through */
  }
  const nav = (navigator.languages || [navigator.language || ''])
    .map((l) => l.slice(0, 2).toLowerCase())
    .find((l) => LANG_CODES.includes(l))
  return nav || DEFAULT_LANG
}

async function loadContent() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3500)
  try {
    const res = await fetch('/api/content', { cache: 'no-store', signal: ctrl.signal })
    if (!res.ok) throw new Error(res.status)
    return await res.json()
  } catch {
    // no content server (static hosting, offline): ship the defaults
    return fallbackContent
  } finally {
    clearTimeout(timer)
  }
}

export default function ContentProvider({ children }) {
  const [content, setContent] = useState(null)
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    let alive = true
    loadContent().then((doc) => alive && setContent(doc))
    return () => {
      alive = false
    }
  }, [])

  const setLang = useCallback((next) => {
    if (!LANG_CODES.includes(next)) return
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  /* document-level language, title and description follow the choice */
  useEffect(() => {
    document.documentElement.lang = lang
    if (!content) return
    document.title = pick(content.meta?.title, lang)
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      pick(content.meta?.description, lang),
    )
  }, [lang, content])

  /* text lengths change with the language, so every trigger re-measures */
  useEffect(() => {
    if (!content) return
    const run = () => ScrollTrigger.refresh()
    const id = setTimeout(run, 180)
    document.fonts?.ready.then(run).catch(() => {})
    return () => clearTimeout(id)
  }, [lang, content])

  const value = useMemo(
    () => ({ c: content, lang, setLang, t: (v) => pick(v, lang) }),
    [content, lang, setLang],
  )

  if (!content) return <div className="boot" aria-hidden="true" />

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
