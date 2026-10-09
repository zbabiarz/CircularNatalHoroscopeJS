import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// After a new publish, an already-open page can reference files that no longer exist; reload once to pick up the new version.
window.addEventListener('vite:preloadError', (event) => {
  if (sessionStorage.getItem('reloaded-after-update')) return
  sessionStorage.setItem('reloaded-after-update', '1')
  event.preventDefault()
  window.location.reload()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)