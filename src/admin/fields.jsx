import { createContext, useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { LANGS, isI18n } from '../content/i18n'
import { src as imgSrc } from '../lib/images'
import { api, prepareImage } from './api'
import { FIXED_LISTS, HINTS, RATIOS, READONLY_KEYS, labelFor } from './schema'

export const EditorCtx = createContext(null)
const useEditor = () => useContext(EditorCtx)

export const isImage = (v) => !!v && typeof v === 'object' && !Array.isArray(v) && 'src' in v

const pathKey = (path) => path.filter((p) => typeof p === 'string').join('.')

/** An empty copy of an item, used when a list grows. */
export function blankLike(v) {
  if (isI18n(v)) return Object.fromEntries(LANGS.map((l) => [l.code, '']))
  if (Array.isArray(v)) return []
  if (v && typeof v === 'object') {
    return Object.fromEntries(
      Object.entries(v).map(([k, val]) => [k, k === 'ratio' ? val : blankLike(val)]),
    )
  }
  return typeof v === 'number' ? 0 : ''
}

/** Missing translations inside a value: one per empty language slot. */
export function countMissing(v) {
  if (isI18n(v)) {
    const filled = LANGS.filter((l) => (v[l.code] || '').trim()).length
    return filled === 0 ? 0 : LANGS.length - filled // wholly empty = intentionally blank
  }
  if (Array.isArray(v)) return v.reduce((n, x) => n + countMissing(x), 0)
  if (v && typeof v === 'object') return Object.values(v).reduce((n, x) => n + countMissing(x), 0)
  return 0
}

/* -------------------------------------------------------------- bits */

function AutoText({ value, onChange, multiline, lang, ...rest }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !multiline) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value, multiline])

  if (multiline) {
    return (
      <textarea
        ref={ref}
        rows={2}
        lang={lang}
        className="f-input f-input--area"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    )
  }
  return (
    <input
      className="f-input"
      lang={lang}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  )
}

function FieldHead({ label, hint, missing, htmlFor }) {
  return (
    <div className="f-head">
      <label className="f-label" htmlFor={htmlFor}>
        {label}
        {missing > 0 && (
          <span className="f-missing" title="Թարգմանությունը բացակայում է">
            {missing} թարգմ․ չկա
          </span>
        )}
      </label>
      {hint && <p className="f-hint">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------- field types */

export function I18nField({ label, hint, value, onChange, multiline, compact }) {
  const { langFilter } = useEditor()
  const id = useId()
  const langs = langFilter === 'all' ? LANGS : LANGS.filter((l) => l.code === langFilter)
  const long =
    multiline || Object.values(value).some((s) => (s || '').length > 70 || (s || '').includes('\n'))

  return (
    <div className={`f f-i18n ${compact ? 'f--compact' : ''}`}>
      <FieldHead label={label} hint={hint} missing={countMissing(value)} htmlFor={`${id}-${langs[0]?.code}`} />
      <div className="f-langs">
        {langs.map((l) => {
          const empty = !(value[l.code] || '').trim()
          return (
            <div className={`f-lang ${empty ? 'is-empty' : ''}`} key={l.code}>
              <span className="f-lang__tag" aria-hidden="true">
                {l.short}
              </span>
              <AutoText
                id={`${id}-${l.code}`}
                aria-label={`${label} — ${l.name}`}
                lang={l.code}
                multiline={long}
                value={value[l.code] || ''}
                onChange={(s) => onChange({ ...value, [l.code]: s })}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TextField({ label, hint, value, onChange, readOnly }) {
  const id = useId()
  return (
    <div className="f">
      <FieldHead label={label} hint={hint} htmlFor={id} />
      <AutoText
        id={id}
        value={String(value ?? '')}
        onChange={onChange}
        readOnly={readOnly}
        multiline={String(value ?? '').includes('\n')}
      />
    </div>
  )
}

function RatioField({ label, value, onChange }) {
  const id = useId()
  return (
    <div className="f">
      <FieldHead label={label} htmlFor={id} />
      <select id={id} className="f-input f-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {RATIOS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ImageField({ label, hint, value, onChange }) {
  const { openLibrary, notify } = useEditor()
  const [busy, setBusy] = useState(false)
  const id = useId()

  const onFile = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const blob = await prepareImage(file)
      const res = await api.upload(blob)
      onChange({ ...value, src: res.url })
      notify('Նկարը վերբեռնված է։ Չմոռանաք պահպանել։')
    } catch (e) {
      notify(
        e.message === 'type'
          ? 'Ընդունվում են միայն JPEG, PNG, WebP կամ AVIF նկարներ։'
          : e.status === 413
            ? 'Ֆայլը չափազանց մեծ է։'
            : 'Վերբեռնումը ձախողվեց։',
        'error',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="f f-img">
      <FieldHead label={label} hint={hint} htmlFor={id} />
      <div className="f-img__row">
        <div
          className={`f-img__thumb ${busy ? 'is-busy' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFile(e.dataTransfer.files?.[0])
          }}
        >
          {value.src ? (
            <img src={imgSrc(value, 480)} alt="" />
          ) : (
            <span className="f-img__none">Նկար չկա</span>
          )}
          {busy && <span className="f-img__busy">Վերբեռնվում է…</span>}
        </div>

        <div className="f-img__side">
          <input
            id={id}
            className="f-input f-input--mono"
            value={value.src}
            placeholder="/uploads/… կամ https://…"
            onChange={(e) => onChange({ ...value, src: e.target.value.trim() })}
          />
          <div className="f-img__actions">
            <label className="a-btn a-btn--ghost">
              Վերբեռնել
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hidden
                onChange={(e) => {
                  onFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button
              type="button"
              className="a-btn a-btn--ghost"
              onClick={() => openLibrary((url) => onChange({ ...value, src: url }))}
            >
              Գրադարան
            </button>
          </div>
          <p className="f-hint">Կարող եք նաև նկարը քաշել ձախ կողմի դաշտի վրա։</p>
        </div>
      </div>

      {value.alt && (
        <I18nField
          compact
          label={labelFor('alt')}
          value={value.alt}
          onChange={(alt) => onChange({ ...value, alt })}
        />
      )}
    </div>
  )
}

/* --------------------------------------------------------------- list */

function summarize(item) {
  if (isI18n(item)) return item.hy || item.en || item.ru || ''
  if (!item || typeof item !== 'object') return String(item ?? '')
  for (const k of ['title', 'caption', 'label', 'value']) {
    if (item[k] != null) return isI18n(item[k]) ? item[k].hy || item[k].en || '' : String(item[k])
  }
  return ''
}

const findImage = (item) =>
  item && typeof item === 'object' ? Object.values(item).find(isImage) : null

function ListField({ label, hint, value, path, onChange }) {
  const fixed = FIXED_LISTS.includes(pathKey(path))
  const simple = value.every((v) => isI18n(v))
  const [open, setOpen] = useState(() => (simple || value.length <= 3 ? 'all' : null))

  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const remove = (i) => {
    if (!window.confirm('Ջնջե՞լ այս տարրը։')) return
    onChange(value.filter((_, k) => k !== i))
  }
  const add = () => {
    const template = value.length ? blankLike(value[value.length - 1]) : ''
    onChange([...value, template])
    setOpen(value.length)
  }

  return (
    <div className="f f-list">
      <FieldHead label={`${label} · ${value.length}`} hint={hint} missing={countMissing(value)} />

      <ol className="f-list__items">
        {value.map((item, i) => {
          const expanded = open === 'all' || open === i
          const img = findImage(item)
          return (
            <li key={i} className={`f-item ${expanded ? 'is-open' : ''} ${simple ? 'f-item--simple' : ''}`}>
              <div className="f-item__bar">
                {!simple && (
                  <button
                    type="button"
                    className="f-item__toggle"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : i)}
                  >
                    <span className="f-item__n">{String(i + 1).padStart(2, '0')}</span>
                    {img?.src && <img className="f-item__thumb" src={imgSrc(img, 120)} alt="" />}
                    <span className="f-item__sum">{summarize(item) || '—'}</span>
                    {countMissing(item) > 0 && <span className="f-dot" title="Թարգմանություն չկա" />}
                  </button>
                )}
                {simple && <span className="f-item__n">{String(i + 1).padStart(2, '0')}</span>}
                {!fixed && (
                  <div className="f-item__tools">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Վերև">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === value.length - 1}
                      aria-label="Ներքև"
                    >
                      ↓
                    </button>
                    <button type="button" className="is-danger" onClick={() => remove(i)} aria-label="Ջնջել">
                      ×
                    </button>
                  </div>
                )}
              </div>

              {(expanded || simple) && (
                <div className="f-item__body">
                  <Node
                    value={item}
                    path={[...path, i]}
                    label={simple ? `${label} ${i + 1}` : undefined}
                    bare={simple}
                    onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {!fixed && (
        <button type="button" className="a-btn a-btn--ghost f-list__add" onClick={add}>
          + Ավելացնել
        </button>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- node */

/**
 * Renders any value in the document by its shape.
 * `bare` drops the label on list children that are a single text.
 */
export function Node({ value, path, onChange, label, bare }) {
  const key = [...path].reverse().find((p) => typeof p === 'string') || ''
  const last = path[path.length - 1]
  const name = label ?? (typeof last === 'string' ? labelFor(last) : '')
  const hint = HINTS[pathKey(path)]
  const isRichTitle = typeof last === 'string' && HINTS[pathKey(path)]?.startsWith('Նոր տող')

  if (isI18n(value)) {
    return (
      <I18nField
        label={name}
        hint={bare ? undefined : hint}
        value={value}
        onChange={onChange}
        multiline={isRichTitle || key === 'address'}
      />
    )
  }
  if (isImage(value)) {
    return <ImageField label={name} hint={hint} value={value} onChange={onChange} />
  }
  if (Array.isArray(value)) {
    return <ListField label={name} hint={hint} value={value} path={path} onChange={onChange} />
  }
  if (value && typeof value === 'object') {
    const body = Object.entries(value).map(([k, v]) => (
      <Node key={k} value={v} path={[...path, k]} onChange={(nv) => onChange({ ...value, [k]: nv })} />
    ))
    // top-level section or list item: no extra frame
    if (path.length <= 1 || typeof last === 'number') return <div className="f-group">{body}</div>
    return (
      <fieldset className="f-set">
        <legend className="f-set__legend">{name}</legend>
        {body}
      </fieldset>
    )
  }
  if (last === 'ratio') return <RatioField label={name} value={value} onChange={onChange} />
  return (
    <TextField
      label={name}
      hint={hint}
      value={value}
      onChange={onChange}
      readOnly={READONLY_KEYS.includes(last)}
    />
  )
}
