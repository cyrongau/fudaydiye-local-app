
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Critical Error Handler for Mobile Debugging
window.onerror = function (message, source, lineno, colno, error) {
  alert(`CRITICAL UI ERROR:\n${message}\nLine: ${lineno}`);
  console.error(error);
  return false;
};

window.onunhandledrejection = function (event) {
  alert(`UNHANDLED PROMISE:\n${event.reason}`);
  console.error(event.reason);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
