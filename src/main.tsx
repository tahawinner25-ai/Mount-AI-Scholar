import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Silencing the expected WebSocket/Vite HMR noises in AI Studio sandboxed preview
if (typeof window !== 'undefined') {
  const isViteOrWSNoise = (msg: string) => {
    return (
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('vite') ||
      msg.toLowerCase().includes('hmr') ||
      msg.toLowerCase().includes('connection')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const msg = typeof reason === 'string' ? reason : (reason.message || '');
      if (isViteOrWSNoise(msg)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isViteOrWSNoise(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorStr = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    if (isViteOrWSNoise(errorStr)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const warnStr = args.map(arg => {
      try {
        return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');

    if (isViteOrWSNoise(warnStr)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Automatically register and update the PWA service worker
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

