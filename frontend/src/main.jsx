import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import appIcon from './assets/icon.png'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from './context/LanguageContext'
import { injectSpeedInsights } from '@vercel/speed-insights'

// Initialize Vercel Speed Insights
injectSpeedInsights()

const faviconLink = document.querySelector("link[rel='icon']") || document.createElement('link')
faviconLink.setAttribute('rel', 'icon')
faviconLink.setAttribute('type', 'image/png')
faviconLink.setAttribute('href', appIcon)
if (!faviconLink.parentNode) {
    document.head.appendChild(faviconLink)
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1
        }
    }
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LanguageProvider>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </LanguageProvider>
    </React.StrictMode>,
)
