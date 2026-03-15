/**
 * Core TypeScript types for DeltaBot Studio
 */

// Blockly Types
export interface BlocklyWorkspace {
  id: string;
  xml: string;
  toolbox: ToolboxDefinition;
}

export interface ToolboxDefinition {
  kind: 'categoryToolbox' | 'flyoutToolbox';
  contents: ToolboxItem[];
}

export interface ToolboxItem {
  kind: 'block' | 'category' | 'sep' | 'button';
  type?: string;
  name?: string;
  text?: string;
  callbackKey?: string;
  items?: ToolboxItem[];
  colour?: string;
  color?: string;
  contents?: ToolboxItem[];
  custom?: string;
}

// Kit Types
export interface Kit {
  id: string;
  name: string;
  description: string;
  version: string;
  manufacturer: string;
  boardType: 'arduino' | 'microbit' | 'esp32' | 'raspberry-pi';
  pinMappings: PinMapping[];
  supportedBlocks: string[];
  firmwareTemplate: string;
  libraries: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PinMapping {
  logicalName: string;
  physicalPin: string | number;
  capabilities: PinCapability[];
  description?: string;
}

export type PinCapability = 'digital' | 'analog' | 'pwm' | 'i2c' | 'spi' | 'uart';

// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  kitId: string;
  blocklyXml: string;
  generatedCode?: string;
  version: number;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface ProjectVersion {
  projectId: string;
  version: number;
  blocklyXml: string;
  generatedCode?: string;
  createdAt: Date;
  createdBy?: string;
}

// Firmware Types
export interface FirmwareBuild {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  firmwarePath?: string;
  buildLog?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CodeGenerationRequest {
  blockXml: string;
  kitId: string;
  targetLanguage?: 'typescript' | 'arduino' | 'python';
}

export interface CodeGenerationResult {
  success: boolean;
  code?: string;
  language?: string;
  errors?: CodeError[];
  warnings?: string[];
}

export interface CodeError {
  line?: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning';
}

// Simulator Types
export interface SimulatorState {
  isRunning: boolean;
  leds: LEDState[];
  motors: MotorState[];
  sensors: SensorState[];
  console: ConsoleMessage[];
}

export interface LEDState {
  id: string;
  pin: string | number;
  state: 'on' | 'off';
  brightness?: number;
  color?: string;
}

export interface MotorState {
  id: string;
  pin: string | number;
  speed: number;
  direction: 'forward' | 'backward' | 'stop';
  state?: 'running' | 'stopped';
}

export interface SensorState {
  id: string;
  type: 'temperature' | 'humidity' | 'distance' | 'light' | 'button';
  pin: string | number;
  value: number | boolean;
  unit?: string;
}

export interface ConsoleMessage {
  timestamp: Date | string;
  level: 'log' | 'warn' | 'error' | 'info' | 'success' | 'warning';
  message: string;
  type?: string;
}

// Upload Manager Types
export interface DeviceInfo {
  vendorId?: number;
  productId?: number;
  serialNumber?: string;
  manufacturer?: string;
  product?: string;
}

export interface UploadProgress {
  bytesSent: number;
  totalBytes: number;
  percentage: number;
  stage: 'connecting' | 'uploading' | 'verifying' | 'completed' | 'failed';
}

// Custom Block Types (v0.6)
export interface CustomBlockInput {
  name: string;
  type: 'number' | 'text' | 'dropdown';
  options?: [string, string][];
}

export interface CustomBlock {
  id: string;
  name: string;
  inputs: CustomBlockInput[];
  template: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

