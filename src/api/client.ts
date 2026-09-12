// src/api/client.ts
import axios from 'axios'
import { TOKEN_KEY, USER_KEY } from '@/constants'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPaymentPolling = /\/payments\/[^\/]+\/status/.test(url);

      if (!isPaymentPolling) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        window.dispatchEvent(new Event('auth:unauthorized'))
      }
    }

    return Promise.reject(error)
  },
)
