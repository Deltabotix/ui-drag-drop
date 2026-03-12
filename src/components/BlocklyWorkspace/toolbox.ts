import { ToolboxDefinition } from '@/types'

/**
 * Custom toolbox definition for DeltaBot Studio
 * Includes blocks for Motors, LEDs, Sensors, and basic logic
 */
export const toolboxDefinition: ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      colour: '210',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      colour: '120',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_forEach' },
        { kind: 'block', type: 'controls_for' },
        { kind: 'block', type: 'controls_whileUntil' },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      colour: '230',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
        { kind: 'block', type: 'math_single' },
        { kind: 'block', type: 'math_trig' },
        { kind: 'block', type: 'math_constant' },
        { kind: 'block', type: 'math_number_property' },
        { kind: 'block', type: 'math_round' },
        { kind: 'block', type: 'math_on_list' },
        { kind: 'block', type: 'math_modulo' },
        { kind: 'block', type: 'math_constrain' },
        { kind: 'block', type: 'math_random_int' },
        { kind: 'block', type: 'math_random_float' },
      ],
    },
    {
      kind: 'category',
      name: 'Motors',
      colour: '20',
      contents: [
        { kind: 'block', type: 'motor_start' },
        { kind: 'block', type: 'motor_stop' },
        { kind: 'block', type: 'motor_set_speed' },
        { kind: 'block', type: 'motor_set_direction' },
      ],
    },
    {
      kind: 'category',
      name: 'LEDs',
      colour: '160',
      contents: [
        { kind: 'block', type: 'led_on' },
        { kind: 'block', type: 'led_off' },
        { kind: 'block', type: 'led_set_brightness' },
        { kind: 'block', type: 'led_set_color' },
        { kind: 'block', type: 'led_clear' },
      ],
    },
    {
      kind: 'category',
      name: 'Sensors',
      colour: '65',
      contents: [
        { kind: 'block', type: 'sensor_read_temperature' },
        { kind: 'block', type: 'sensor_read_humidity' },
        { kind: 'block', type: 'sensor_read_distance' },
        { kind: 'block', type: 'sensor_read_light' },
        { kind: 'block', type: 'sensor_read_button' },
      ],
    },
    {
      kind: 'category',
      name: 'Variables',
      custom: 'VARIABLE',
      colour: '330',
    },
    {
      kind: 'category',
      name: 'Functions',
      custom: 'PROCEDURE',
      colour: '290',
    },
  ],
}

