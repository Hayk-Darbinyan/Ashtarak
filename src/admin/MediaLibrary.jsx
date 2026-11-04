import { useEffect, useState } from 'react'
import { api } from './api'

const kb = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} ՄԲ` : `${Math.round(n / 1024)} ԿԲ`)

/** Every uploaded image, to reuse one or clear out the unused. */
export default function MediaLibrary({ docJson, onPick, onClose, notify }) {
  const [files, setFiles] = useState(null)

  const load = () =>
    api
      .uploads()
      .then(setFiles)
      .catch(() => setFiles([]))

  useEffect(() => {
    load()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remove = async (f) => {
    const used = docJson.includes(f.url)
    const msg = used
      ? 'Այս նկարն օգտագործվում է կայքում։ Ջնջելու դեպքում այն կանհետանա։ Շարունակե՞լ։'
      : 'Ջնջե՞լ նկարը ընդմիշտ։'
    if (!window.confirm(msg)) return
    await api.removeUpload(f.name)
    notify('Նկարը ջնջված է։')
    load()
  }

  return (
    <div className="lib" role="dialog" aria-modal="true" aria-label="Նկարների գրադարան">
      <button className="lib__scrim" onClick={onClose} aria-label="Փակել" />
      <div className="lib__panel">
        <header className="lib__head">
          <h2 className="lib__title">Գրադարան</h2>
          <button className="a-btn a-btn--ghost" onClick={onClose}>
            Փակել
          </button>
        </header>

        {files === null && <p className="lib__empty">Բեռնվում է…</p>}
        {files?.length === 0 && (
          <p className="lib__empty">Դեռ վերբեռնված նկարներ չկան։ Օգտագործեք «Վերբեռնել» կոճակը։</p>
        )}

        <ul className="lib__grid">
          {files?.map((f) => (
            <li key={f.name} className="lib__item">
              {onPick ? (
                <button
                  className="lib__pick"
                  onClick={() => {
                    onPick(f.url)
                    onClose()
                  }}
                >
                  <img src={f.url} alt="" loading="lazy" />
                </button>
              ) : (
                <a className="lib__pick" href={f.url} target="_blank" rel="noopener">
                  <img src={f.url} alt="" loading="lazy" />
                </a>
              )}
              <div className="lib__meta">
                <span>{kb(f.size)}</span>
                {docJson.includes(f.url) && <span className="lib__used">օգտագործվում է</span>}
                <button className="lib__del" onClick={() => remove(f)} aria-label="Ջնջել">
                  Ջնջել
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
