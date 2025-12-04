import axios from 'axios'

// Use environment variable for API base URL, fallback to relative path for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

// Log API configuration in development
if (import.meta.env.DEV) {
  console.log('[API Service] API Base URL:', API_BASE_URL || 'Not set (using relative path /api)')
  console.log('[API Service] Full baseURL:', API_BASE_URL ? `${API_BASE_URL}/api` : '/api')
}

// Warn in production if API URL is not set
if (import.meta.env.PROD && !API_BASE_URL) {
  console.warn('[API Service] WARNING: VITE_API_BASE_URL is not set in production!')
  console.warn('[API Service] API calls will use relative paths, which may not work correctly.')
  console.warn('[API Service] Please set VITE_API_BASE_URL in Vercel environment variables.')
}

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout (can be overridden per request)
})

// Request interceptor - Add auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api

