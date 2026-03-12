/**
 * Firmware Assembler Service
 * Inserts user code into firmware templates
 */

import { Kit } from '@/types'

export class FirmwareAssembler {
  /**
   * Assemble firmware by inserting user code into template
   */
  static assemble(userCode: string, kit: Kit): string {
    const template = kit.firmwareTemplate

    // Replace placeholders in template
    let firmware = template.replace('{{USER_CODE}}', userCode)
    
    // Add required libraries
    if (kit.libraries.length > 0) {
      const libraryIncludes = kit.libraries
        .map((lib) => `#include <${lib}>`)
        .join('\n')
      firmware = firmware.replace('{{LIBRARIES}}', libraryIncludes)
    }

    // Replace pin mappings
    kit.pinMappings.forEach((mapping) => {
      const placeholder = `{{PIN_${mapping.logicalName.toUpperCase()}}}`
      firmware = firmware.replace(
        new RegExp(placeholder, 'g'),
        String(mapping.physicalPin)
      )
    })

    return firmware
  }

  /**
   * Validate assembled firmware
   */
  static validate(firmware: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check for unresolved placeholders
    const placeholderRegex = /\{\{.*?\}\}/g
    const placeholders = firmware.match(placeholderRegex)
    if (placeholders) {
      errors.push(`Unresolved placeholders: ${placeholders.join(', ')}`)
    }

    // Check for basic syntax issues (simplified)
    if (!firmware.includes('setup') || !firmware.includes('loop')) {
      errors.push('Missing required Arduino functions (setup/loop)')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

