import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Debug: Log request payload for firmware endpoints
        if (config.url?.includes('/firmware/')) {
          console.log('🔍 apiClient request interceptor:', {
            url: config.url,
            method: config.method,
            data: config.data,
            dataType: typeof config.data,
          })
        }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle errors globally
        if (error.response) {
          // Server responded with error
          const apiError = error.response.data as ApiResponse
          
          // Create a proper error object
          if (apiError.error) {
            const errorObj = {
              ...apiError.error,
              code: apiError.error.code || 'UNKNOWN_ERROR',
              message: apiError.error.message || 'An error occurred',
            }
            return Promise.reject(errorObj)
          }
          
          return Promise.reject(error)
        } else if (error.request) {
          // Request made but no response
          return Promise.reject({
            code: 'NETWORK_ERROR',
            message: 'Network error. Please check your connection.',
          })
        } else {
          // Something else happened
          return Promise.reject(error)
        }
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return this.extractData(response.data)
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return this.extractData(response.data)
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return this.extractData(response.data)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return this.extractData(response.data)
  }

  private extractData<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error?.message || 'Unknown error')
    }
    // Backend may return { success: true, data: null } e.g. for DELETE
    return response.data as T
  }
}

export const apiClient = new ApiClient()

