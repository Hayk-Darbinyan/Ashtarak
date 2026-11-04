const KEY = 'hortus.admin.token'

export const token = {
  get: () => {
    try {
      return sessionStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set: (v) => {
    try {
      sessionStorage.setItem(KEY, v)
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
  },
}

async function req(path, { method = 'GET', body, raw = false, headers = {} } = {}) {
  const t = token.get()
  let res
  try {
    res = await fetch(path, {
      method,
      cache: 'no-store',
      headers: {
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(body && !raw ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: raw ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    const err = new Error('network')
    err.status = 0
    throw err
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  login: (password) => req('/api/login', { method: 'POST', body: { password } }),
  logout: () => req('/api/logout', { method: 'POST' }).catch(() => {}),
  session: () => req('/api/session'),
  content: () => req('/api/content'),
  save: (doc) => req('/api/content', { method: 'PUT', body: doc }),
  reset: () => req('/api/content/reset', { method: 'POST' }),
  uploads: () => req('/api/uploads'),
  upload: (blob) =>
    req('/api/upload', { method: 'POST', body: blob, raw: true, headers: { 'Content-Type': blob.type } }),
  removeUpload: (name) => req(`/api/uploads/${encodeURIComponent(name)}`, { method: 'DELETE' }),
}

/**
 * Phone photographs arrive at 5–10 MB. Resample in the browser to at most
 * 2400 px on the long edge and re-encode as WebP before upload, so the site
 * never serves a camera original.
 */
export async function prepareImage(file, maxEdge = 2400) {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
    throw new Error('type')
  }
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file // browser cannot decode (e.g. some AVIF) — send as is
  }
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
  if (blob && blob.type === 'image/webp') return blob
  return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
}
