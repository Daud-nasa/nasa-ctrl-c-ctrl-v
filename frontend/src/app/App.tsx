import { useEffect } from 'react'
import { HomePage } from '@pages/home'

export function App() {
  useEffect(() => {
    const telegramWebApp = window.Telegram?.WebApp
    if (!telegramWebApp) return

    telegramWebApp.ready()
    telegramWebApp.expand()
    telegramWebApp.setHeaderColor?.('#07111d')
    telegramWebApp.setBackgroundColor?.('#07111d')
  }, [])

  return <HomePage />
}
