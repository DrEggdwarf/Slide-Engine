import React from 'react'
import ReactDOM from 'react-dom/client'
import { Presentation } from './engine/Presentation'
import { slides } from './engine/slides'
import './design/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Presentation slides={slides} />
  </React.StrictMode>
)
