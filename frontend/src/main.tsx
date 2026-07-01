import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/press-start-2p/latin-400.css'
import '@fontsource/press-start-2p/latin-ext-400.css'
import '@fontsource/vt323/latin-400.css'
import '@fontsource/vt323/latin-ext-400.css'
import '@fontsource/alegreya/latin-400.css'
import '@fontsource/alegreya/latin-ext-400.css'
import '@fontsource/alegreya/latin-700.css'
import '@fontsource/alegreya/latin-ext-700.css'
import { api } from './api'
import {
  isNativePlatform,
  hasNotificationPermission,
  setupNotificationChannels,
  syncAllReminderNotifications,
  syncAllBillNotifications,
  syncAllHolidayNotifications,
} from './notifications'
import { getBrazilianHolidays } from './game/holidays'
import { SettingsProvider } from './contexts/SettingsContext'
import { GameProvider } from './game/GameContext'
import './index.css'
import App from './App.tsx'

if (isNativePlatform()) {
  hasNotificationPermission().then(async (granted) => {
    if (granted) {
      await setupNotificationChannels()
      const [reminders, bills] = await Promise.all([api.reminders.list(), api.bills.list()])
      const year = new Date().getFullYear()
      const holidays = [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)]
      await syncAllReminderNotifications(reminders)
      await syncAllBillNotifications(bills)
      await syncAllHolidayNotifications(holidays)
    }
  })
} else {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <GameProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GameProvider>
    </SettingsProvider>
  </StrictMode>,
)
