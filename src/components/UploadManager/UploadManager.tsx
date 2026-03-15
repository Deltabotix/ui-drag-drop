import React, { useState, useCallback } from 'react'
import { hasWebSerial, requestPort } from '../../services/serialPortService'
import './UploadManager.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const COMPILE_API = `${API_BASE.replace(/\/$/, '')}/upload/compile`
const KIT_TO_FQBN: Record<string, string> = {
  'arduino-uno': 'arduino:avr:uno',
  'arduino-nano': 'arduino:avr:nano',
}
const KIT_TO_BOARD_TYPE: Record<string, 'uno' | 'nano' | 'nanoOldBootloader'> = {
  'arduino-uno': 'uno',
  'arduino-nano': 'nano',
}

interface UploadManagerProps {
  assembledCode?: string
  selectedKitId?: string
  /** Display label when user has connected via Connect in header (optional) */
  connectedPort?: string | null
  /** Kept for UI display only; upload now requests port fresh each time */
  connectedSerialPort?: SerialPort | null
}

const UploadManager: React.FC<UploadManagerProps> = ({
  assembledCode,
  selectedKitId = 'arduino-uno',
  connectedPort: _connectedPort,
  connectedSerialPort: _connectedSerialPort,
}) => {
  const [uploading, setUploading] = useState(false)
  const [log, setLog] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const isPlaceholder = !assembledCode || assembledCode.includes('Run to generate') || assembledCode.includes('// Code will appear here')
  const hasCode = assembledCode && assembledCode.includes('void setup()') && assembledCode.includes('void loop()') && !isPlaceholder
  const useWebSerial = hasWebSerial()

  const handleUpload = useCallback(async () => {
    if (!hasCode) {
      setError('Click Run first to generate code.')
      return
    }
    if (!useWebSerial) {
      setError('Upload from browser requires Chrome or Edge (Web Serial API).')
      return
    }
    setUploading(true)
    setError(null)
    setLog(null)
    setSuccess(false)
    try {
      setLog('Select your Arduino in the browser dialog…')
      const entry = await requestPort()
      if (!entry) {
        setError('No device selected. Click Upload again and choose your board.')
        setLog(null)
        return
      }
      setLog('Compiling...')
      const board = KIT_TO_FQBN[selectedKitId] || KIT_TO_FQBN['arduino-uno']
      const res = await fetch(COMPILE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: assembledCode?.trim(), board }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success || !data.hexBase64) {
        setLog([data.log, data.message].filter(Boolean).join('\n'))
        setError(data.message || 'Compilation failed.')
        return
      }
      setLog('Compiled. Flashing to board...')
      const boardType = KIT_TO_BOARD_TYPE[selectedKitId] || 'uno'
      const { flashHex } = await import('../../services/avrFlasher')
      const result = await flashHex(
        data.hexBase64,
        entry.port,
        boardType,
        (pct) => setLog(`Flashing… ${pct}%`)
      )
      setLog(result.log || result.message)
      if (result.success) {
        setSuccess(true)
        setError(null)
      } else {
        setError(result.message || 'Upload failed.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.')
      setLog(null)
    } finally {
      setUploading(false)
    }
  }, [assembledCode, selectedKitId, hasCode, useWebSerial])

  return (
    <div className="upload-manager">
      <div className="upload-header">
        <h3>Upload to Arduino</h3>
      </div>

      <div className="upload-content">
        <div className="instructions-section" style={{ padding: '1.25rem', background: '#e8f5e9', borderRadius: '8px', fontSize: '0.95rem', maxWidth: '520px' }}>
          <p style={{ margin: '0 0 1rem 0', color: '#333' }}>
            Connect your Arduino via USB. Click <strong>Upload to Arduino</strong> — your browser will ask you to select the board, then we compile and flash.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={handleUpload}
              disabled={!hasCode || !useWebSerial || uploading}
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '1rem', fontWeight: 600, alignSelf: 'flex-start' }}
            >
              {uploading ? 'Compiling & uploading…' : 'Upload to Arduino'}
            </button>

            {!hasCode && (
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
                Click <strong>Run</strong> in the header to generate code, then <strong>Upload to Arduino</strong>.
              </p>
            )}
            {!hasWebSerial() && (
              <p style={{ fontSize: '0.85rem', color: '#c62828', margin: 0 }}>
                Upload from browser requires Chrome or Edge (Web Serial API). Use HTTPS or localhost.
              </p>
            )}
          </div>

          {log && (
            <pre style={{ marginTop: '1rem', padding: '0.75rem', background: '#f5f5f5', fontSize: '0.8rem', overflow: 'auto', maxHeight: '160px', borderRadius: '4px' }}>
              {log}
            </pre>
          )}

          {success && <p style={{ color: '#2e7d32', fontWeight: 600, marginTop: '0.5rem' }}>Upload complete.</p>}
          {error && <p style={{ color: '#c62828', marginTop: '0.5rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}

export default UploadManager
