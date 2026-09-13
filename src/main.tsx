import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import App from './App'
import './styles.css'
import './portal.css'
import './catalog.css'
import './booking.css'

// Recover once when a long-lived tab references a chunk replaced by a deployment.
window.addEventListener('vite:preloadError', (event) => {
  try {
    const key = 'tafaseel-chunk-reload'
    const last = Number(sessionStorage.getItem(key) || 0)
    if (navigator.onLine && Date.now() - last > 60000) {
      event.preventDefault()
      sessionStorage.setItem(key, String(Date.now()))
      location.reload()
    }
  } catch {
    /* The error boundary still offers a manual reload. */
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IconContext.Provider value={{ weight: 'regular', size: 22, 'aria-hidden': true }}>
      <HashRouter>
        <App />
      </HashRouter>
    </IconContext.Provider>
  </React.StrictMode>,
)
