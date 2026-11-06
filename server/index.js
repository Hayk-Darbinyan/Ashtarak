/**
 * HORTUS content server.
 *
 * Small on purpose: one JSON document holds every word and photograph on the
 * site, an admin with a password edits it, and uploaded images live on disk.
 * In production the same process also serves the built site from /dist.
 *
 *   GET    /api/content            public — the whole document
 *   POST   /api/login              { password } -> { token }
 *   POST   /api/logout
 *   GET    /api/session            200 while the token is valid
 *   PUT    /api/content            admin — replace the document (previous one is backed up)
 *   POST   /api/content/reset      admin — restore the shipped defaults
 *   GET    /api/uploads            admin — list uploaded images
 *   POST   /api/upload             admin — raw image body -> { url }
 *   DELETE /api/uploads/:name      admin
 */

import express from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STORAGE = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'storage'))
const UPLOADS = path.join(STORAGE, 'uploads')
const BACKUPS = path.join(STORAGE, 'backups')
const CONTENT = path.join(STORAGE, 'content.json')
const PASSWORD_FILE = path.join(STORAGE, 'admin-password.txt')
const DEFAULTS = path.join(ROOT, 'src', 'content', 'default.json')
const DIST = path.join(ROOT, 'dist')
// `--port` wins (dev pins the API to 5180 next to Vite); hosts set PORT
const argPort = process.argv.indexOf('--port')
const PORT = Number(argPort > -1 ? process.argv[argPort + 1] : process.env.PORT) || 5180
const KEEP_BACKUPS = 30
const SESSION_TTL = 12 * 60 * 60 * 1000

for (const dir of [STORAGE, UPLOADS, BACKUPS]) fs.mkdirSync(dir, { recursive: true })

/* ------------------------------------------------------------ password */

function loadPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  if (fs.existsSync(PASSWORD_FILE)) return fs.readFileSync(PASSWORD_FILE, 'utf8').trim()
  const generated = crypto.randomBytes(9).toString('base64url')
  fs.writeFileSync(PASSWORD_FILE, generated + '\n', { mode: 0o600 })
  console.log('\n  Admin password created:', generated)
  console.log('  Saved in storage/admin-password.txt — change it there or set ADMIN_PASSWORD.\n')
  return generated
}

const PASSWORD = loadPassword()

const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

/* ------------------------------------------------------------ sessions */

const sessions = new Map() // token -> expiry
const failures = new Map() // ip -> { count, until }

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const expiry = sessions.get(token)
  if (!token || !expiry || expiry < Date.now()) {
    if (token) sessions.delete(token)
    return res.status(401).json({ error: 'unauthorized' })
  }
  sessions.set(token, Date.now() + SESSION_TTL)
  next()
}

/* ------------------------------------------------------------- content */

async function readContent() {
  try {
    return JSON.parse(await fsp.readFile(CONTENT, 'utf8'))
  } catch {
    const defaults = await fsp.readFile(DEFAULTS, 'utf8')
    await fsp.writeFile(CONTENT, defaults)
    return JSON.parse(defaults)
  }
}

async function writeContent(doc) {
  if (fs.existsSync(CONTENT)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    await fsp.copyFile(CONTENT, path.join(BACKUPS, `content-${stamp}.json`))
    const old = (await fsp.readdir(BACKUPS)).filter((f) => f.endsWith('.json')).sort()
    for (const f of old.slice(0, Math.max(0, old.length - KEEP_BACKUPS))) {
      await fsp.unlink(path.join(BACKUPS, f)).catch(() => {})
    }
  }
  // write-then-rename, so a crash mid-write never leaves half a document
  const tmp = CONTENT + '.tmp'
  await fsp.writeFile(tmp, JSON.stringify(doc, null, 2))
  await fsp.rename(tmp, CONTENT)
}

const REQUIRED_KEYS = ['meta', 'brand', 'nav', 'hero', 'water', 'garden', 'gallery', 'visit', 'footer', 'ui']

function validate(doc) {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return 'Document must be an object'
  const missing = REQUIRED_KEYS.filter((k) => !(k in doc))
  if (missing.length) return `Missing sections: ${missing.join(', ')}`
  return null
}

/* -------------------------------------------------------------- images */

const TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

// trust the bytes, not the header
function sniff(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp'
  if (buf.toString('ascii', 4, 12) === 'ftypavif') return 'avif'
  return null
}

const UPLOAD_NAME = /^[a-z0-9-]+\.(jpg|png|webp|avif)$/

/* ----------------------------------------------------------------- app */

const app = express()
app.disable('x-powered-by')

app.get('/api/content', async (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json(await readContent())
})

app.post('/api/login', express.json({ limit: '10kb' }), (req, res) => {
  const ip = req.ip
  const f = failures.get(ip)
  if (f && f.until > Date.now()) {
    return res.status(429).json({ error: 'locked', retryIn: Math.ceil((f.until - Date.now()) / 1000) })
  }
  if (!safeEqual(req.body?.password ?? '', PASSWORD)) {
    const count = (f?.count || 0) + 1
    failures.set(ip, { count, until: count >= 5 ? Date.now() + 60_000 : 0 })
    return res.status(401).json({ error: 'wrong-password' })
  }
  failures.delete(ip)
  const token = crypto.randomBytes(32).toString('base64url')
  sessions.set(token, Date.now() + SESSION_TTL)
  res.json({ token })
})

app.post('/api/logout', (req, res) => {
  const header = req.get('authorization') || ''
  sessions.delete(header.replace(/^Bearer /, ''))
  res.json({ ok: true })
})

app.get('/api/session', requireAdmin, (_req, res) => res.json({ ok: true }))

app.put('/api/content', requireAdmin, express.json({ limit: '2mb' }), async (req, res) => {
  const problem = validate(req.body)
  if (problem) return res.status(400).json({ error: problem })
  await writeContent(req.body)
  res.json({ ok: true, savedAt: new Date().toISOString() })
})

app.post('/api/content/reset', requireAdmin, async (_req, res) => {
  const defaults = JSON.parse(await fsp.readFile(DEFAULTS, 'utf8'))
  await writeContent(defaults)
  res.json(defaults)
})

app.get('/api/uploads', requireAdmin, async (_req, res) => {
  const names = (await fsp.readdir(UPLOADS)).filter((n) => UPLOAD_NAME.test(n))
  const files = await Promise.all(
    names.map(async (name) => {
      const stat = await fsp.stat(path.join(UPLOADS, name))
      return { name, url: `/uploads/${name}`, size: stat.size, time: stat.mtimeMs }
    }),
  )
  res.json(files.sort((a, b) => b.time - a.time))
})

app.post(
  '/api/upload',
  requireAdmin,
  express.raw({ type: Object.keys(TYPES), limit: '15mb' }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
      return res.status(400).json({ error: 'Send a JPEG, PNG, WebP or AVIF image' })
    }
    const ext = sniff(req.body)
    if (!ext) return res.status(415).json({ error: 'Not a supported image' })
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}.${ext}`
    await fsp.writeFile(path.join(UPLOADS, name), req.body)
    res.json({ url: `/uploads/${name}`, name })
  },
)

app.delete('/api/uploads/:name', requireAdmin, async (req, res) => {
  const { name } = req.params
  if (!UPLOAD_NAME.test(name)) return res.status(400).json({ error: 'bad name' })
  await fsp.unlink(path.join(UPLOADS, name)).catch(() => {})
  res.json({ ok: true })
})

// file names are unique per upload, so they can be cached forever
app.use('/uploads', express.static(UPLOADS, { maxAge: '365d', immutable: true, fallthrough: false }))

app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }))

// production: serve the built site, falling back to index.html for /admin etc.
if (fs.existsSync(path.join(DIST, 'index.html'))) {
  app.use(express.static(DIST, { index: false, maxAge: '1h' }))
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
}

app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error(err)
  res.status(status).json({ error: status === 413 ? 'File too large' : err.message || 'error' })
})

const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
  console.log(`  HORTUS content server on http://${HOST}:${PORT}`)
})
