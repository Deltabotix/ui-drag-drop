/**
 * Custom Blockly blocks for LED and timing (Arduino output)
 * Used by backend to generate Arduino code from XML
 */
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

const LED_BLOCKS = [
  {
    type: 'led_on',
    message0: 'Set LED ON  pin %1',
    args0: [
      {
        type: 'field_number',
        name: 'PIN',
        value: 13,
        min: 0,
        max: 99,
      },
    ],
    previousStatement: true,
    nextStatement: true,
    colour: 320,
    tooltip: 'Turn LED on at given pin (e.g. 13 = built-in LED)',
  },
  {
    type: 'led_off',
    message0: 'Set LED OFF  pin %1',
    args0: [
      {
        type: 'field_number',
        name: 'PIN',
        value: 13,
        min: 0,
        max: 99,
      },
    ],
    previousStatement: true,
    nextStatement: true,
    colour: 320,
    tooltip: 'Turn LED off at given pin',
  },
  {
    type: 'delay_ms',
    message0: 'Wait %1 ms',
    args0: [
      {
        type: 'field_number',
        name: 'DURATION',
        value: 500,
        min: 1,
        max: 60000,
      },
    ],
    previousStatement: true,
    nextStatement: true,
    colour: 120,
    tooltip: 'Pause for given milliseconds',
  },
]

export function registerLedBlocks(): void {
  Blockly.common.defineBlocksWithJsonArray(LED_BLOCKS)
  // Placeholder JS so workspace doesn't error; real code comes from backend
  javascriptGenerator.forBlock['led_on'] = (block: Blockly.Block) =>
    `digitalWrite(${block.getFieldValue('PIN')}, HIGH);\n`
  javascriptGenerator.forBlock['led_off'] = (block: Blockly.Block) =>
    `digitalWrite(${block.getFieldValue('PIN')}, LOW);\n`
  javascriptGenerator.forBlock['delay_ms'] = (block: Blockly.Block) =>
    `delay(${block.getFieldValue('DURATION')});\n`
}

export const LED_BLOCK_TYPES = ['led_on', 'led_off', 'delay_ms'] as const
