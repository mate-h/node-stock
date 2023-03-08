import { App } from './app'
import '@mateh/react-stock/dist/style.css'
import { createRoot } from 'react-dom/client'
import { createElement } from 'react'

async function load() {
  createRoot(document.getElementById('app')!).render(createElement(App))
}

load()
