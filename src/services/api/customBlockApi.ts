import { apiClient } from './apiClient'
import type { CustomBlock, CustomBlockInput } from '@/types'

export const customBlockApi = {
  list: async (): Promise<CustomBlock[]> => {
    return apiClient.get<CustomBlock[]>('/custom-blocks')
  },

  getById: async (id: string): Promise<CustomBlock> => {
    return apiClient.get<CustomBlock>(`/custom-blocks/${id}`)
  },

  create: async (data: { name: string; inputs: CustomBlockInput[]; template: string }): Promise<CustomBlock> => {
    return apiClient.post<CustomBlock>('/custom-blocks', data)
  },

  update: async (id: string, data: Partial<{ name: string; inputs: CustomBlockInput[]; template: string }>): Promise<CustomBlock> => {
    return apiClient.put<CustomBlock>(`/custom-blocks/${id}`, data)
  },

  remove: async (id: string): Promise<void> => {
    return apiClient.delete(`/custom-blocks/${id}`)
  },
}
