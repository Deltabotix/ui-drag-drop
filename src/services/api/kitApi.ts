import { apiClient } from './apiClient'
import { Kit } from '@/types'

export const kitApi = {
  /**
   * Get all available kits
   */
  getAll: async (): Promise<Kit[]> => {
    return apiClient.get<Kit[]>('/kits')
  },

  /**
   * Get kit by ID
   */
  getById: async (id: string): Promise<Kit> => {
    return apiClient.get<Kit>(`/kits/${id}`)
  },
}

