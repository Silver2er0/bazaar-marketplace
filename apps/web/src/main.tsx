import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const theme = localStorage.getItem('theme')
document.documentElement.classList.toggle(
  'dark',
  theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
