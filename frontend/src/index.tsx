import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { initializeFirebase } from 'shared';

// Add an immediate console log to verify the file is being executed
console.log('Script starting...');

try {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY || '',
    authDomain: import.meta.env.VITE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_APP_ID || '',
    measurementId: import.meta.env.VITE_MEASUREMENT_ID || '',
  };

  initializeFirebase(firebaseConfig);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
  );

} catch (error) {
  console.error('Initialization error:', error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;">
    Initialization Error: ${error instanceof Error ? error.message : 'Unknown error'}
  </div>`;
}