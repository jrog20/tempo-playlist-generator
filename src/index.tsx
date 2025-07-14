import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
// root.render(
   //   <React.StrictMode>
   //     <App />
   //   </React.StrictMode>
   // );
   const params = new URLSearchParams(window.location.search);
   if (params.get('code') && !window.location.hash.includes('/callback')) {
     // Redirect to the callback route, preserving the code and any other params
     window.location.replace(
       `${window.location.origin}${window.location.pathname}#${'/callback'}${window.location.search}`
     );
   }
   root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
