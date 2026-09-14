import React, { useCallback, useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SplashScreen from './components/ui/SplashScreen.jsx'
import './styles/index.css'
import './i18n'

const Root = () => {
  const [showSplash, setShowSplash] = useState(true)
  const handleSplashDone = useCallback(() => setShowSplash(false), [])

  return (
    <>
      {showSplash && <SplashScreen key="splash" onComplete={handleSplashDone} />}
      <App />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
