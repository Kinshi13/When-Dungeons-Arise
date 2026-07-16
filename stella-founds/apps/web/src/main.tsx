import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/quicksand/400.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/700.css';
import './index.css';
import { AppContainerProvider } from '@stella-founds/core';
import { createWebContainer } from './data/createWebContainer';
import { App } from './App.tsx';

const webContainer = createWebContainer();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppContainerProvider container={webContainer}>
        <App />
      </AppContainerProvider>
    </BrowserRouter>
  </StrictMode>,
);
