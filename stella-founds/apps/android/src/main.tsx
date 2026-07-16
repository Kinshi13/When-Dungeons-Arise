import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
import './index.css';
import '@stella-founds/stella-ui/src/components/StellaInput.css';
import App from './App.tsx';
import { AppContainerProvider } from '@stella-founds/core';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppContainerProvider>
        <App />
      </AppContainerProvider>
    </BrowserRouter>
  </StrictMode>,
);
