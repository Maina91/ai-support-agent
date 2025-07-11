import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.js';
import './styles.css';

// Get API configuration from environment
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const adminApiKey = import.meta.env.VITE_ADMIN_API_KEY || '';

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App apiBaseUrl={apiBaseUrl} adminApiKey={adminApiKey} />
  </React.StrictMode>
);