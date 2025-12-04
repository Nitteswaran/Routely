import api from '../services/api'
import { useAuth } from '@clerk/clerk-react'

/**
 * Custom hook to get API instance with Clerk token
 * Use this in components that need to make authenticated API calls
 */
export const useClerkApi = () => {
  const { getToken } = useAuth()

  const clerkApi = {
    get: async (url, config = {}) => {
      const token = await getToken()
      return api.get(url, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
    },
    post: async (url, data, config = {}) => {
      const token = await getToken()
      return api.post(url, data, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
    },
    put: async (url, data, config = {}) => {
      const token = await getToken()
      return api.put(url, data, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
    },
    delete: async (url, config = {}) => {
      const token = await getToken()
      return api.delete(url, {
        ...config,
        headers: {
          ...config.headers,
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
    },
  }

  return clerkApi
}

export default useClerkApi

