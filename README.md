# HORTUS — Pool Garden

A site for a fictional private pool garden above the Kasagh gorge in
Aragatsotn, in Armenian, Russian and English, with an admin panel for every
word and photograph on it.

React + Vite, GSAP/ScrollTrigger, Lenis, one custom WebGL water shader, and a
small Express server that stores the content.

```bash
npm install
npm run dev        # site  http://127.0.0.1:5178
                   # admin http://127.0.0.1:5178/admin
```

`npm run dev` starts two processes: Vite on 5178 and the content server on
5180 (Vite proxies `/api` and `/uploads` to it).

## Admin panel — `/admin`

On first start the server creates a password, prints it in the terminal and
saves it to `storage/admin-password.txt`. Change it by editing that file (and
restarting), or set the `ADMIN_PASSWORD` environment variable.

What it does:

- Every section of the site in the left column; each text shows its Armenian,
  Russian and English versions together. Empty translations are highlighted,
  and the sidebar counts what is missing per section.
- The filter at the top (Բոլորը / Հայ / Рус / Eng) shows one language at a
  time when you are translating.
- Headlines use two marks only: a new line is a line break, `*word*` is the
  italic accent.
- Photographs: upload (or drag onto the preview), pick from the library, or
  paste a URL. Uploads are resized in the browser to 2400 px and converted to
  WebP before they are sent, so camera originals never reach the site. Each
  photo has a description in three languages for accessibility and search.
- Lists (gallery, the day, figures, species, links, paragraphs) can be
  reordered, added to and removed from.
- **Պահպանել** (or Ctrl/Cmd+S) publishes immediately. **Չեղարկել** drops
  unsaved edits. The tab warns before closing with unsaved changes.
- Every save keeps the previous version in `storage/backups/` (last 30).
  **Վերականգնել սկզբնականը** restores the shipped content.

The admin is a separate bundle; visitors never download it.

## Languages

`hy`, `ru`, `en`. The visitor's choice is remembered; the first visit follows
the browser language, falling back to Armenian. `?lang=ru` forces one.
`<html lang>`, the page title and the meta description follow the language.

Instrument Serif / Sans and DM Mono have no Armenian or Cyrillic glyphs, so
the stacks fall through, glyph by glyph, to Noto Serif Armenian, Noto Serif
Display and Noto Sans — narrowed on their width axis to sit beside the
condensed Latin display face. Google Fonts serves them by unicode range, so a
reader only downloads the script they are reading.

## Content

Everything lives in one JSON document. The shipped version is
`src/content/default.json`; the live version is `storage/content.json`,
created from it on first run. A translatable field is `{ "hy", "ru", "en" }`;
a photograph is `{ "src", "alt": { "hy", "ru", "en" } }`. The admin renders
the document by shape, so adding a field to the JSON makes it editable with no
admin code (labels and hints are in `src/admin/schema.js`).

If the site is opened without the server (static hosting), it falls back to
the bundled defaults.

## Production

```bash
npm run build
npm start          # serves the site, /admin, /api and /uploads on $PORT (default 5180)
```

This needs a Node host (a VPS, Render, Railway, Fly…), not static hosting, and
the `storage/` folder must be on persistent disk — it holds the content,
uploads, backups and password. Set `HOST=0.0.0.0` if the platform requires it.
Put it behind HTTPS so the admin password is never sent in the clear.

## Structure

```
server/index.js           content API, auth, uploads, backups; serves dist in production
storage/                  runtime data (git-ignored)
src/
  main.jsx                routes /admin to the admin bundle, everything else to the site
  content/
    default.json          all copy and photographs, in three languages
    ContentProvider.jsx   loads the document, holds the language
    i18n.js               pick(), rich() headline markup, language list
  admin/                  AdminApp, generic field editors, media library, labels
  lib/                    motion, smooth scroll, image URLs, capability probes
  components/             the eight sections + preloader, cursor, nav
  components/three/       WaterPanel + the GLSL
  components/ui/          Figure, Headline, CountUp, LangSwitch, Marquee, SplitText
```

## The water

One fragment shader (`waterShader.js`) does both water surfaces. A photograph
is sampled through a domain-warped noise field: the gradient bends the lookup
so the image refracts, and the ridges of the same field are raised to a power
to draw caustic veins. The pointer pushes the field and sends a ring through
it. The photograph sits in the DOM under every canvas, so without WebGL the
section keeps everything but the movement. Whatever photo the admin sets as
the hero or pool image becomes the water.

## Motion off

`?motion=off` renders the resting state — every reveal resolved, no
preloader. `prefers-reduced-motion` does the same. `?gl=off` disables WebGL.
