import React from 'react'
import ReactDOM from 'react-dom/client'
import { Presentation } from './engine/Presentation'
import { Console } from './engine/Console'
import { MobilePilot } from './engine/MobilePilot'
import { slides } from './engine/slides'
import './design/globals.css'

// Routage minimal (SPA fallback en dev) :
//   /          → scène (autorité de navigation, à projeter)
//   /console   → régie présentateur (même machine, écran de contrôle)
//   /pilote    → régie mobile (téléphone, sur le réseau local, via PIN)
const path = window.location.pathname.replace(/\/+$/, '')
const Root = path === '/console' ? <Console slides={slides} />
  : path === '/pilote' ? <MobilePilot slides={slides} />
  : <Presentation slides={slides} />

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{Root}</React.StrictMode>
)
