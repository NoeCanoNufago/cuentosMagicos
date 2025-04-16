import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('¿Nueva versión disponible. Actualizar?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('¡La aplicación está lista para uso sin conexión!')
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
