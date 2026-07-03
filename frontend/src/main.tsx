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
// Fonte redonda/moderna usada só no tema Lo-fi (ver [data-theme="lofi"] em index.css).
import '@fontsource/quicksand/latin-400.css'
import '@fontsource/quicksand/latin-ext-400.css'
import '@fontsource/quicksand/latin-500.css'
import '@fontsource/quicksand/latin-ext-500.css'
import '@fontsource/quicksand/latin-600.css'
import '@fontsource/quicksand/latin-ext-600.css'
import '@fontsource/quicksand/latin-700.css'
import '@fontsource/quicksand/latin-ext-700.css'
import { api } from './api'
import {
  isNativePlatform,
  hasNotificationPermission,
  setupNotificationChannels,
  syncAllReminderNotifications,
  syncAllBillNotifications,
  syncAllHolidayNotifications,
  syncAllBirthdayNotifications,
} from './notifications'
import { getBrazilianHolidays } from './game/holidays'
import { syncReminderWidget, syncCalendarWidget, syncCurrencyWidgetPair } from './widgetBridge'
import { getCurrencyWidgetPair } from './currencyWidgetStore'
import { isSyncAvailable } from './auth'
import { syncAllNow } from './sync'
import { SettingsProvider } from './contexts/SettingsContext'
import './index.css'
import App from './App.tsx'

// Sincronização entre aparelhos (Fase 2: Lembretes, Notas, Contas, Despesas,
// Carteira e Alarmes) — roda em qualquer plataforma (não só nativo), sozinha
// se não estiver configurada/logada (ver syncAllNow em sync.ts). Uma vez ao
// abrir o app e depois a cada 2min enquanto ficar aberto — não precisa de
// WebSocket/realtime nessa fase, um intervalo simples já resolve.
if (isSyncAvailable()) {
  syncAllNow()
  setInterval(() => {
    syncAllNow()
  }, 2 * 60 * 1000)
}

if (isNativePlatform()) {
  // Widgets nativos não dependem de permissão de notificação — sincroniza
  // sempre que o app abre, pra pegar qualquer lembrete/conta criado ou
  // concluído desde a última vez (o widget não vê o app fechado atualizando
  // dados).
  Promise.all([api.reminders.list(), api.bills.list()]).then(([reminders, bills]) => {
    syncReminderWidget(reminders)
    syncCalendarWidget(reminders, bills)
  })
  syncCurrencyWidgetPair(getCurrencyWidgetPair())

  hasNotificationPermission().then(async (granted) => {
    if (granted) {
      await setupNotificationChannels()
      const [reminders, bills] = await Promise.all([api.reminders.list(), api.bills.list()])
      const year = new Date().getFullYear()
      const holidays = [...getBrazilianHolidays(year), ...getBrazilianHolidays(year + 1)]
      await syncAllReminderNotifications(reminders)
      await syncAllBillNotifications(bills)
      await syncAllHolidayNotifications(holidays)
      await syncAllBirthdayNotifications(reminders)
    }
  })
} else {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </StrictMode>,
)
