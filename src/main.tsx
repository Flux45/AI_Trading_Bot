// Ensure fetch can be reassigned without throwing "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined') {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let _activeFetch = origFetch;
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (!desc || !desc.set) {
      Object.defineProperty(window, 'fetch', {
        configurable: true,
        enumerable: true,
        get: () => _activeFetch,
        set: (fn) => {
          _activeFetch = typeof fn === 'function' ? fn : origFetch;
        },
      });
    }
  }
} catch (_) {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
