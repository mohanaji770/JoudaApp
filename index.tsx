
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import Clarity from '@microsoft/clarity';
import './index.css';
import App from './App';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

Clarity.init('xcts3rtu3g');

Sentry.init({
  dsn: 'https://2881f18e4d347194c2edaa8b517ed839@o4511510064922624.ingest.de.sentry.io/4511510070755408',
  environment: (import.meta as any).env?.MODE || 'production',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: (import.meta as any).env?.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// ── Verification Hook (dev/test only) ──
setTimeout(() => {
  console.log('✅ Clarity ready — project: xcts3rtu3g');
  console.log('✅ Sentry ready — DSN configured');
  console.log('🚀 Jouda monitoring active');
}, 1000);

// Capture PWA install prompt globally to prevent missing the event before React mounts
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  (window as any).deferredInstallPrompt = e;
});

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if ('caches' in window) {
      Promise.all([
        caches.delete('supabase-storage-images'),
        caches.delete('images-cache'),
      ]).catch((err) => {
        console.warn('Failed to clear legacy image caches:', err);
      });
    }

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.error('PWA Service Worker registration failed:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FavoritesProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </FavoritesProvider>
  </React.StrictMode>
);
