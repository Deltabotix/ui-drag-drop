import { apiClient } from './apiClient'
import { Project } from '@/types'

export const projectApi = {
  /**
   * Get all projects
   * Backend returns { total, projects } - we unwrap to return projects array
   */
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<{ total: number; projects: Project[] } | Project[]>('/projects')
    if (Array.isArray(response)) return response
    return (response as { total: number; projects: Project[] }).projects ?? []
  },

  /**
   * Get project by ID
   */
  getById: async (id: string): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`)
  },

  /**
   * Create new project
   */
  create: async (project: Partial<Project>): Promise<Project> => {
    return apiClient.post<Project>('/projects', project)
  },

  /**
   * Update project
   */
  update: async (id: string, project: Partial<Project>): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, project)
  },

  /**
   * Delete project
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/projects/${id}`)
  },

  /**
   * Save project XML (backend PUT /projects/:id accepts blocklyXml in body)
   */
  saveXml: async (id: string, xml: string): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, { blocklyXml: xml })
  },
}

