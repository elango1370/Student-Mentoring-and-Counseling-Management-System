import axios from 'axios';

// VITE_API_URL drives every request. When it is missing (a fresh checkout with
// no .env file) fall back to the local API in development so the app still runs,
// and to a same-origin /api path in production builds.
const configuredURL = import.meta.env.VITE_API_URL;
const baseURL = (configuredURL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')).replace(/\/+$/, '');

if (!configuredURL) {
  console.warn(`VITE_API_URL is not defined. Falling back to "${baseURL}". Create frontend/.env from .env.example to override it.`);
}

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

const TOKEN_KEY = 'smcms_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

client.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const registerUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    const serverMessage = typeof payload === 'object' && payload !== null ? payload.message : null;
    let message = serverMessage || error.message || 'Something went wrong.';

    // A 404 without a JSON body means the request never reached the API server.
    if (status === 404 && !serverMessage) {
      message = `API endpoint not found at ${baseURL}. Check that the backend is running and VITE_API_URL is correct.`;
    }
    if (error.code === 'ECONNABORTED') message = 'The request timed out. Please try again.';
    if (!error.response && error.message === 'Network Error') {
      message = 'Cannot reach the server. Check your connection and the API URL.';
    }

    if (status === 401 && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }

    return Promise.reject({
      status,
      message,
      details: payload?.details || null,
      raw: error,
    });
  }
);

export default client;
