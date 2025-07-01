import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Initialize the React app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
});

// Handle unsaved changes warning before unload
window.addEventListener('beforeunload', (e) => {
    // The app component will handle this through the Electron API
    e.preventDefault();
    e.returnValue = '';
});
