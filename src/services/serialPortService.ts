/**
 * Web Serial API helpers: port detection and selection in the browser (user's system only).
 * Requires Chrome/Edge and secure context (HTTPS or localhost).
 */

export function hasWebSerial(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator && typeof navigator.serial?.getPorts === 'function' && typeof navigator.serial?.requestPort === 'function'
}

export interface SerialPortEntry {
  port: SerialPort
  label: string
}

function labelForPort(port: SerialPort, index: number): string {
  try {
    const info = port.getInfo()
    if (info.usbVendorId !== undefined && info.usbProductId !== undefined) {
      const v = '0x' + (info.usbVendorId & 0xffff).toString(16).toUpperCase().padStart(4, '0')
      const p = '0x' + (info.usbProductId & 0xffff).toString(16).toUpperCase().padStart(4, '0')
      return `Arduino / USB (${v}:${p})`
    }
  } catch (_) {
    // ignore
  }
  return `Serial port ${index + 1}`
}

export async function getPorts(): Promise<SerialPortEntry[]> {
  if (!hasWebSerial()) return []
  const ports = await navigator.serial!.getPorts()
  return ports.map((port, i) => ({ port, label: labelForPort(port, i) }))
}

export async function requestPort(): Promise<SerialPortEntry | null> {
  if (!hasWebSerial()) return null
  try {
    const port = await navigator.serial!.requestPort({ filters: [] })
    return { port, label: labelForPort(port, 0) }
  } catch (e) {
    if (e instanceof Error && e.name === 'NotFoundError') return null
    throw e
  }
}
