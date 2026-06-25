import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent benign Vite HMR and WebSocket errors from popping up or logging in the user's browser
if (typeof window !== 'undefined') {
  const isWebsocketError = (msg: string) => {
    return (
      msg.toLowerCase().includes('websocket') ||
      msg.toLowerCase().includes('vite') ||
      msg.toLowerCase().includes('hmr') ||
      msg.toLowerCase().includes('closed without opened')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : (reason?.message || '');
    if (isWebsocketError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (isWebsocketError(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Intercept WebSocket creation for Vite HMR and return a dummy harmless closed socket
  const OriginalWebSocket = window.WebSocket;
  if (OriginalWebSocket) {
    const CustomWebSocket = function (url: string | URL, protocols?: string | string[]) {
      const urlStr = String(url);
      if (
        urlStr.includes('vite') || 
        urlStr.includes('hmr') ||
        (Array.isArray(protocols) && protocols.includes('vite-hmr')) || 
        (typeof protocols === 'string' && protocols.includes('vite-hmr'))
      ) {
        console.log('Intercepted and silenced Vite HMR WebSocket connection to:', urlStr);
        const dummySocket = {
          url: urlStr,
          readyState: 3, // CLOSED
          bufferedAmount: 0,
          extensions: '',
          protocol: '',
          binaryType: 'blob',
          onopen: null,
          onerror: null,
          onclose: null,
          onmessage: null,
          send: () => {},
          close: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        };
        return dummySocket;
      }
      return new OriginalWebSocket(url, protocols);
    };

    // Keep prototypes and constants intact
    CustomWebSocket.prototype = OriginalWebSocket.prototype;
    Object.defineProperty(CustomWebSocket, 'CONNECTING', { value: OriginalWebSocket.CONNECTING });
    Object.defineProperty(CustomWebSocket, 'OPEN', { value: OriginalWebSocket.OPEN });
    Object.defineProperty(CustomWebSocket, 'CLOSING', { value: OriginalWebSocket.CLOSING });
    Object.defineProperty(CustomWebSocket, 'CLOSED', { value: OriginalWebSocket.CLOSED });

    try {
      Object.defineProperty(window, 'WebSocket', {
        value: CustomWebSocket,
        writable: true,
        configurable: true,
        enumerable: true
      });
    } catch (e) {
      console.warn('Could not override window.WebSocket:', e);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
