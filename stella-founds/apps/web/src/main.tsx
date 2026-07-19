import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
import './index.css';
import { AppContainerProvider } from '@stella-founds/core';
import { App } from './App.tsx';
import { AppErrorBoundary } from './app/AppErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        {/* No container override: same IndexedDB-backed container Android uses
            (see AppContainerProvider's default in @stella-founds/core) — Web
            no longer runs on an in-memory fake seeded with placeholder data. */}
        <AppContainerProvider>
          <App />
        </AppContainerProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
