/**
 * Set Buffer on globalThis before any other libs (intel-hex, stk500) load.
 * Must be imported first in avrFlasher.
 */
import { Buffer } from 'buffer'
if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer
}
