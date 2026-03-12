/**
 * Input blocks: Digital Read, Analog Read (v0.5)
 * Used by backend to generate Arduino code from XML
 */
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'

const ANALOG_PINS = [
  ['A0', 'A0'],
  ['A1', 'A1'],
  ['A2', 'A2'],
  ['A3', 'A3'],
  ['A4', 'A4'],
  ['A5', 'A5'],
]

const INPUT_BLOCKS = [
  {
    type: 'digital_read',
    message0: 'Digital Read pin %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PIN',
        options: [
          ['2', '2'],
          ['3', '3'],
          ['4', '4'],
          ['5', '5'],
          ['6', '6'],
          ['7', '7'],
          ['8', '8'],
          ['9', '9'],
          ['10', '10'],
          ['11', '11'],
          ['12', '12'],
          ['13', '13'],
        ],
      },
    ],
    output: 'Number',
    colour: 260,
    tooltip: 'Read HIGH (1) or LOW (0) from digital pin. Use with Compare (e.g. == 1).',
  },
  {
    type: 'analog_read',
    message0: 'Analog Read pin %1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'PIN',
        options: ANALOG_PINS,
      },
    ],
    output: 'Number',
    colour: 260,
    tooltip: 'Read 0–1023 from analog pin (e.g. potentiometer, sensor).',
  },
]

export function registerInputBlocks(): void {
  Blockly.common.defineBlocksWithJsonArray(INPUT_BLOCKS)
  javascriptGenerator.forBlock['digital_read'] = (block: Blockly.Block) =>
    `digitalRead(${block.getFieldValue('PIN')})`
  javascriptGenerator.forBlock['analog_read'] = (block: Blockly.Block) =>
    `analogRead(${block.getFieldValue('PIN')})`
}

export const INPUT_BLOCK_TYPES = ['digital_read', 'analog_read'] as const
