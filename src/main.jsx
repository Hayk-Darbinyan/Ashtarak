import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/base.css'

/* The page opens with a held panel and a scripted entrance. Letting the
   browser drop a returning visitor halfway down mid-sequence — and doing it
   late, once the images have sized — breaks both. We start at the top. */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// The admin is its own bundle: visitors never download it.
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin'

const Site = lazy(async () => {
  const [{ default: App }, { default: ContentProvider }] = await Promise.all([
    import('./App.jsx'),
    import('./content/ContentProvider.jsx'),
  ])
  return {
    default: () => (
      <ContentProvider>
        <App />
      </ContentProvider>
    ),
  }
})

const Admin = lazy(() => import('./admin/AdminApp.jsx'))

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<div className={isAdmin ? 'boot boot--light' : 'boot'} />}>
      {isAdmin ? <Admin /> : <Site />}
    </Suspense>
  </React.StrictMode>,
)
