import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

/**
 * Renderer Entry Point
 * 
 * This is the main entry point for the React renderer process.
 * It initializes the React application and mounts it to the DOM.
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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);