import './main.css';

// import React from 'react'
import ReactDOM from 'react-dom/client';
import App from './App';

// do NOT use React.StrictMode, it will break the simulator because
// of handling of the IPC events twice
ReactDOM.createRoot(document.getElementById('main') as HTMLElement).render(
  // <React.StrictMode>
  <App />,
  // </React.StrictMode>,
);
