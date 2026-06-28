import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "react-hot-toast"
import App from "./App"
import "./styles/globals.css"

const queryClient = new QueryClient()

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