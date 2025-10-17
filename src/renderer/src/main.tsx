import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

/**
 * Renderer Entry Point
 * 
 * This is the main entry point for the React renderer process.
 * It initializes the React application and mounts it to the DOM.
 * 
 * Note: Using HashRouter instead of BrowserRouter for Electron compatibility.
 * BrowserRouter doesn't work with file:// protocol, while HashRouter uses URL hash
 * for routing which works perfectly in packaged Electron apps.
 */

// Ensure we have access to the Electron API
if (!window.electronAPI) {
  console.error('Electron API not available. Make sure preload script is loaded.');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);