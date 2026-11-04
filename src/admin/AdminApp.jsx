import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LANGS } from '../content/i18n'
import { api, token } from './api'
import { EditorCtx, Node, countMissing } from './fields'
import MediaLibrary from './MediaLibrary'
import { SECTIONS } from './schema'
import './admin.css'

/* ------------------------------------------------------------- login */

function Login({ onDone, notice }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(notice || '')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const { token: tk } = await api.login(password)
      token.set(tk)
      onDone()
    } catch (err) {
      setError(
        err.status === 0
          ? 'Սերվերը հասանելի չէ։ Համոզվեք, որ այն գործարկված է (npm run dev)։'
          : err.status === 429
            ? `Չափազանց շատ փորձեր։ Փորձեք ${err.data?.retryIn || 60} վայրկյանից։`
            : 'Սխալ գաղտնաբառ։',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="a-login">
      <form className="a-login__card" onSubmit={submit}>
        <p className="a-login__mark">HORTUS</p>
        <h1 className="a-login__title">Կառավարման վահանակ</h1>
        <label className="f-label" htmlFor="pw">
          Գաղտնաբառ
        </label>
        <input
          id="pw"
          className="f-input"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && (
          <p className="a-login__error" role="alert">
            {error}
          </p>
        )}
        <button className="a-btn a-btn--solid" disabled={busy || !password}>
          {busy ? 'Ստուգվում է…' : 'Մուտք'}
        </button>
        <a className="a-login__back" href="/">
          ← Վերադառնալ կայք
        </a>
      </form>
    </main>
  )
}

/* ------------------------------------------------------------ editor */

export function Editor({ initial, onLogout }) {
  const [doc, setDoc] = useState(initial)
  const [saved, setSaved] = useState(() => JSON.stringify(initial))
  const [section, setSection] = useState(() => {
    const h = window.location.hash.slice(1)
    return SECTIONS.some((s) => s.key === h) ? h : SECTIONS[0].key
  })
  const [langFilter, setLangFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [toasts, setToasts] = useState([])
  const [library, setLibrary] = useState(null)
  const main = useRef(null)

  const docJson = useMemo(() => JSON.stringify(doc), [doc])
  const dirty = docJson !== saved

  const notify = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const save = useCallback(async () => {
    if (saving) return
    setSaving(true)
    try {
      await api.save(doc)
      setSaved(JSON.stringify(doc))
      notify('Պահպանված է։ Փոփոխություններն արդեն կայքում են։')
    } catch (e) {
      if (e.status === 401) return onLogout('Սեսիան ավարտվել է։ Մուտք գործեք կրկին․ չպահպանված փոփոխությունները կկորչեն։')
      notify(e.status === 0 ? 'Սերվերը հասանելի չէ։' : `Չհաջողվեց պահպանել․ ${e.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }, [doc, saving, notify, onLogout])

  /* Ctrl/Cmd + S */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, save])

  /* don't lose work to a closed tab */
  useEffect(() => {
    const onUnload = (e) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
  }, [dirty])

  const choose = (key) => {
    setSection(key)
    history.replaceState(null, '', `#${key}`)
    main.current?.scrollTo({ top: 0 })
  }

  const revert = () => {
    if (!window.confirm('Չեղարկե՞լ բոլոր չպահպանված փոփոխությունները։')) return
    setDoc(JSON.parse(saved))
  }

  const reset = async () => {
    if (
      !window.confirm(
        'Վերադարձնե՞լ ամբողջ կայքի տեքստերն ու նկարները սկզբնական տարբերակին։\nՆախորդ տարբերակը կպահվի storage/backups թղթապանակում։',
      )
    )
      return
    try {
      const fresh = await api.reset()
      setDoc(fresh)
      setSaved(JSON.stringify(fresh))
      notify('Սկզբնական բովանդակությունը վերականգնված է։')
    } catch {
      notify('Չհաջողվեց վերականգնել։', 'error')
    }
  }

  const current = SECTIONS.find((s) => s.key === section)
  const ctx = useMemo(
    () => ({ langFilter, notify, openLibrary: (onPick) => setLibrary({ onPick }) }),
    [langFilter, notify],
  )

  return (
    <EditorCtx.Provider value={ctx}>
      <div className="adm">
        <aside className="adm__side">
          <div className="adm__brand">
            <span className="adm__mark">HORTUS</span>
            <span className="adm__sub">Կառավարում</span>
          </div>

          <nav className="adm__nav" aria-label="Բաժիններ">
            {SECTIONS.map((s) => {
              const missing = countMissing(doc[s.key])
              return (
                <button
                  key={s.key}
                  className={`adm__navbtn ${s.key === section ? 'is-on' : ''}`}
                  onClick={() => choose(s.key)}
                  aria-current={s.key === section ? 'page' : undefined}
                >
                  <span>{s.title}</span>
                  {missing > 0 && (
                    <span className="adm__badge" title="Բացակայող թարգմանություններ">
                      {missing}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="adm__sidefoot">
            <a className="adm__link" href="/" target="_blank" rel="noopener">
              Դիտել կայքը ↗
            </a>
            <button className="adm__link" onClick={() => setLibrary({ onPick: null })}>
              Նկարների գրադարան
            </button>
            <button className="adm__link adm__link--muted" onClick={reset}>
              Վերականգնել սկզբնականը
            </button>
            <button className="adm__link adm__link--muted" onClick={() => onLogout()}>
              Ելք
            </button>
          </div>
        </aside>

        <main className="adm__main" ref={main}>
          <header className="adm__bar">
            <div className="adm__bar-title">
              <h1 className="adm__h1">{current.title}</h1>
              <p className="adm__desc">{current.desc}</p>
            </div>

            <div className="adm__bar-tools">
              <div className="adm__filter" role="group" aria-label="Ցուցադրվող լեզուներ">
                {[{ code: 'all', short: 'Բոլորը' }, ...LANGS].map((l) => (
                  <button
                    key={l.code}
                    className={langFilter === l.code ? 'is-on' : ''}
                    aria-pressed={langFilter === l.code}
                    onClick={() => setLangFilter(l.code)}
                  >
                    {l.short}
                  </button>
                ))}
              </div>

              <span className={`adm__state ${dirty ? 'is-dirty' : ''}`} aria-live="polite">
                {saving ? 'Պահպանվում է…' : dirty ? 'Կան չպահպանված փոփոխություններ' : 'Ամեն ինչ պահպանված է'}
              </span>
              {dirty && (
                <button className="a-btn a-btn--ghost" onClick={revert}>
                  Չեղարկել
                </button>
              )}
              <button className="a-btn a-btn--solid" onClick={save} disabled={!dirty || saving}>
                Պահպանել
              </button>
            </div>
          </header>

          <div className="adm__content">
            <Node
              key={section}
              value={doc[section]}
              path={[section]}
              onChange={(v) => setDoc((d) => ({ ...d, [section]: v }))}
            />
          </div>
        </main>
      </div>

      {library && (
        <MediaLibrary
          docJson={docJson}
          notify={notify}
          onPick={library.onPick}
          onClose={() => setLibrary(null)}
        />
      )}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <p key={t.id} className={`toast toast--${t.kind}`}>
            {t.text}
          </p>
        ))}
      </div>
    </EditorCtx.Provider>
  )
}

/* -------------------------------------------------------------- root */

export default function AdminApp() {
  const [state, setState] = useState({ phase: 'checking' })

  const load = useCallback(async () => {
    try {
      await api.session()
      const doc = await api.content()
      setState({ phase: 'ready', doc })
    } catch (e) {
      token.clear()
      setState({ phase: 'login', notice: e.status === 0 ? 'Սերվերը հասանելի չէ։ Համոզվեք, որ այն գործարկված է (npm run dev)։' : '' })
    }
  }, [])

  useEffect(() => {
    document.title = 'HORTUS — Կառավարում'
    document.documentElement.lang = 'hy'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    if (token.get()) load()
    else setState({ phase: 'login' })
    return () => robots.remove()
  }, [load])

  const logout = useCallback(async (notice = '') => {
    await api.logout()
    token.clear()
    setState({ phase: 'login', notice })
  }, [])

  if (state.phase === 'checking') return <div className="boot boot--light" />
  if (state.phase === 'login') return <Login notice={state.notice} onDone={load} />
  return <Editor initial={state.doc} onLogout={logout} />
}
