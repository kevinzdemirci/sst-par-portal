import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LoginGate } from './components/LoginGate'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoginGate>{session => <App session={session} />}</LoginGate>
  </React.StrictMode>,
)
