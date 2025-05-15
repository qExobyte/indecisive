import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Get the root DOM element and ensure it's not null
const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error("Root element not found");
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
