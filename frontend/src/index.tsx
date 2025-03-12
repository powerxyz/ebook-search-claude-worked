import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.tsx';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

// Add a request interceptor to add the authorization token to all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Make sure to format correctly with 'Bearer ' prefix
    config.headers.Authorization = `Bearer ${token}`;
    
    // For debugging
    console.log("Sending request with token to:", config.url);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add a response interceptor to handle token-related errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.config?.url, error.response?.status, error.response?.data);
    
    // Only handle unauthorized errors (401)
    // Do NOT redirect on 422 errors as they may not be auth-related
    if (error.response && error.response.status === 401) {
      console.log('Authentication issue detected (401), redirecting to login');
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      // Only redirect if not already on login page
      if (!window.location.href.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);