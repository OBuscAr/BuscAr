import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  if (accessToken) {
    config.headers.Authorization = `${tokenType} ${accessToken}`;
  }
  return config;
});

export default api;