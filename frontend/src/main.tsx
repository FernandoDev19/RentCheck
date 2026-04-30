import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LoadingProvider } from './core/context/loading-context/LoadingContext.tsx'

createRoot(document.getElementById('root')!).render(
  <LoadingProvider>
    <App />
  </LoadingProvider>,
)
