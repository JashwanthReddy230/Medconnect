import axios from 'axios'
import { tokenManager } from '@/utils/tokenManager'

const api = axios.create({
  // VITE_API_URL is empty in dev → Vite proxy forwards /auth/* to :8081
  // In production set VITE_API_URL=https://your-api-host
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request — attach access token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response — on 401, clear tokens and redirect to login
// (The current backend does not expose a refresh-token endpoint,
//  so we simply sign the user out and let them re-authenticate.)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      tokenManager.clearTokens()
      // Avoid redirect loops on the login page itself
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired'
      }
    }
    return Promise.reject(error)
  }
)

export default api
