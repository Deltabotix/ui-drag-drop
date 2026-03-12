/**
 * AVR/Arduino flash via Web Serial using STK500 protocol.
 * Compile runs on backend; this runs in the browser on the user's machine.
 */
import './bufferPolyfill'
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream'
import intelHex from 'intel-hex'
import { Buffer } from 'buffer'
import Stk500 from 'stk500'

const BOARD_OPTS: Record<string, { signature: number[]; pageSize: number; timeout: number; baudRate: number; pagesizehigh: number; pagesizelow: number }> = {
  uno: { signature: [0x1e, 0x95, 0x0f], pageSize: 128, timeout: 400, baudRate: 115200, pagesizehigh: 0, pagesizelow: 128 },
  nano: { signature: [0x1e, 0x95, 0x0f], pageSize: 128, timeout: 400, baudRate: 115200, pagesizehigh: 0, pagesizelow: 128 },
  nanoOldBootloader: { signature: [0x1e, 0x95, 0x0f], pageSize: 128, timeout: 400, baudRate: 57600, pagesizehigh: 0, pagesizelow: 128 },
}

export type BoardType = 'uno' | 'nano' | 'nanoOldBootloader'

export interface FlashResult {
  success: boolean
  message: string
  log?: string
}

/**
 * Flash hex (base64-encoded .hex file content) to the board over the given SerialPort.
 * Port must not be open; we open it here and close when done.
 */
export async function flashHex(
  hexBase64: string,
  serialPort: SerialPort,
  boardType: BoardType,
  onProgress?: (percent: number) => void
): Promise<FlashResult> {
  const boardConfig = BOARD_OPTS[boardType] || BOARD_OPTS.uno
  const logLines: string[] = []

  try {
    const hexString = atob(hexBase64)
    const parsed = intelHex.parse(hexString)
    const hex = parsed.data
    if (!hex || hex.length === 0) {
      return { success: false, message: 'Invalid hex: no data', log: logLines.join('\n') }
    }

    // Try to ensure a clean state; if it's already open, close+reopen cleanly.
    try {
      await serialPort.close()
      await new Promise((r) => setTimeout(r, 100))
    } catch (_) {
      // Port may already be closed; ignore
    }

    try {
      await serialPort.open({ baudRate: boardConfig.baudRate })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/already open/i.test(msg)) {
        // Port still appears open; force close again, wait a bit longer, then retry once.
        logLines.push('Port was busy, retrying…')
        try {
          await serialPort.close()
        } catch (_) {}
        await new Promise((r) => setTimeout(r, 300))
        await serialPort.open({ baudRate: boardConfig.baudRate })
      } else {
        throw err
      }
    }
    logLines.push('Port opened.')

    const reader = new ReadableWebToNodeStream(serialPort.readable)
    const writer = serialPort.writable.getWriter()
    const stream = reader as unknown as { write: (buf: Buffer | Uint8Array, cb: (err?: Error | null) => void) => void; on: (ev: string, fn: (chunk: Buffer) => void) => void; removeListener: (ev: string, fn: unknown) => void }
    stream.write = (buf: Buffer | Uint8Array, cb: (err?: Error | null) => void) => {
      const u8 = Buffer.isBuffer(buf) ? new Uint8Array(buf) : buf
      writer.write(u8).then(() => cb(null)).catch((e) => cb(e instanceof Error ? e : new Error(String(e))))
    }

    const board = {
      signature: Buffer.from(boardConfig.signature),
      pageSize: boardConfig.pageSize,
      timeout: boardConfig.timeout,
      pagesizehigh: boardConfig.pagesizehigh,
      pagesizelow: boardConfig.pagesizelow,
    }

    return await new Promise<FlashResult>((resolve) => {
      // stk500 typings are not great; treat as any to avoid TS/JS interop issues
      const Stk500Ctor: any = Stk500 as any
      const stk: any = new Stk500Ctor({ quiet: true })

      stk.bootload(stream, hex, board, false, (err?: Error | null) => {
        writer.releaseLock()
        // Close port after successful upload so that next upload starts from a clean state.
        serialPort.close().catch(() => {})
        if (err) {
          logLines.push('Flash error: ' + err.message)
          resolve({ success: false, message: err.message || 'Upload failed', log: logLines.join('\n') })
        } else {
          onProgress?.(100)
          logLines.push('Upload complete.')
          resolve({ success: true, message: 'Upload complete!', log: logLines.join('\n') })
        }
      })
    })
  } catch (e) {
    try {
      await serialPort.close()
    } catch (_) {}
    const msg = e instanceof Error ? e.message : String(e)
    logLines.push('Error: ' + msg)
    const isOpenError = /open|serial port|Failed to open/i.test(msg)
    const suggestion = isOpenError
      ? ' Close Arduino IDE/Serial Monitor if open, unplug and replug the board, then try again. On Linux: sudo usermod -aG dialout $USER then log out and back in.'
      : ''
    return {
      success: false,
      message: msg + suggestion,
      log: logLines.join('\n'),
    }
  }
}
