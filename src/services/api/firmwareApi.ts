import { apiClient } from './apiClient'
import { CodeGenerationResult, CodeGenerationRequest } from '@/types'

export const firmwareApi = {
  /**
   * Generate code from Blockly XML
   */
  generateCode: async (request: CodeGenerationRequest): Promise<CodeGenerationResult> => {
    // Validate and extract blockXml as string
    let blockXmlString: string
    if (typeof request.blockXml === 'string') {
      blockXmlString = request.blockXml
    } else if (request.blockXml && typeof request.blockXml === 'object') {
      // Handle nested object case (defensive)
      blockXmlString = (request.blockXml as any).blockXml || String(request.blockXml)
    } else {
      blockXmlString = String(request.blockXml || '')
    }
    
    // Ensure kitId is valid
    if (!request.kitId) {
      throw new Error('Kit ID is required')
    }
    
    // Debug: Log what we're sending
    console.log('📤 Sending to backend:', {
      blockXmlType: typeof blockXmlString,
      blockXmlLength: blockXmlString.length,
      blockXmlPreview: blockXmlString.substring(0, 100),
      kitId: request.kitId,
      requestObject: request,
    })
    
    // Send flat structure (not nested)
    const payload = {
      blockXml: blockXmlString,
      kitId: request.kitId,
    }
    
    console.log('📦 Payload being sent:', payload)
    
    const result = await apiClient.post<any>('/firmware/generate', payload)
    // Backend returns { success: true, data: { code, language, ... } }
    // apiClient.get/post already extracts .data from response
    return {
      code: result.code || '',
      language: result.language || 'typescript',
      success: true,
    } as CodeGenerationResult
  },

  /**
   * Assemble firmware from Blockly XML
   */
  assemble: async (blockXml: string, kitId: string): Promise<{ firmware: string; kitId: string }> => {
    const result = await apiClient.post<{ firmware: string; kitId: string }>('/firmware/assemble', {
      blockXml,
      kitId,
    })
    return result
  },
}

