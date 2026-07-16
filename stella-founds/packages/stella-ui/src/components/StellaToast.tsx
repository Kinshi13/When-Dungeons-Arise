import { useEffect, useState } from 'react';
import './StellaToast.css';

export type StellaToastTone = 'success' | 'error' | 'info';

interface StellaToastMessage {
  id: number;
  text: string;
  tone: StellaToastTone;
}

let nextId = 1;
let currentListener: ((message: StellaToastMessage) => void) | null = null;

/** Imperative trigger — call from anywhere (services, event handlers) without prop-drilling a toast context. Only one <StellaToastViewport> should be mounted per app. */
export function showStellaToast(text: string, tone: StellaToastTone = 'info') {
  currentListener?.({ id: nextId++, text, tone });
}

/** Mount once near the app root. Renders the most recent toast, auto-dismissing after ~2.5s. */
export function StellaToastViewport() {
  const [message, setMessage] = useState<StellaToastMessage | null>(null);

  useEffect(() => {
    currentListener = setMessage;
    return () => {
      currentListener = null;
    };
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message) return null;

  return (
    <div className={`stella-toast stella-toast--${message.tone}`} role="status" aria-live="polite">
      {message.text}
    </div>
  );
}
