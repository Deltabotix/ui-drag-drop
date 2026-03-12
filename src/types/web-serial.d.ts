/**
 * Web Serial API types (Chrome/Edge).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
 */
interface SerialPortInfo {
  usbVendorId?: number
  usbProductId?: number
}

interface SerialOptions {
  baudRate: number
  dataBits?: number
  stopBits?: number
  parity?: 'none' | 'odd' | 'even'
  bufferSize?: number
  flowControl?: 'none' | 'hardware'
}

interface SerialPortFilter {
  usbVendorId?: number
  usbProductId?: number
}

interface Serial extends EventTarget {
  getPorts(): Promise<SerialPort[]>
  requestPort(filters?: { filters?: SerialPortFilter[] }): Promise<SerialPort>
}

declare global {
  interface Navigator {
    serial?: Serial
  }
  interface SerialPort {
    open(options: SerialOptions): Promise<void>
    close(): Promise<void>
    getInfo(): SerialPortInfo
    readonly readable: ReadableStream<Uint8Array>
    readonly writable: WritableStream<Uint8Array>
  }
}

export {}
