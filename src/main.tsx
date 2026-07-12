import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import App from "./App"
import "./styles/globals.css"
import "./styles/maya.css"
import "./i18n/config"
import { startAutoSync } from "./lib/offlineSync"

const queryClient = new QueryClient()

//dark-off
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App/>
        <Toaster position="top-right" toastOptions={{style:{background:"#14161e",color:"#e2e8f0",border:"1px solid #1e2130"}}}/>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

// ── PWA: register service worker + auto-update ──────────────
// When a new version deploys, the new service worker activates immediately
// (skipWaiting/clients.claim in sw.js) and this reloads the page once to
// pick it up — no manual update, no app-store/APK reinstall needed.
// Replay any actions queued while offline, and keep syncing.
startAutoSync()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* PWA install is optional, ignore failures */ })
  })
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
}