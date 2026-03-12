import React, { useState, useEffect, useCallback } from 'react'
import { hasWebSerial, getPorts, requestPort, type SerialPortEntry } from '../../services/serialPortService'
import './ConnectDialog.css'

interface ConnectDialogProps {
  open: boolean
  onClose: () => void
  onConnect: (port: SerialPort, label: string) => void
  currentPort: string | null
}

const ConnectDialog: React.FC<ConnectDialogProps> = ({
  open,
  onClose,
  onConnect,
}) => {
  const [portEntries, setPortEntries] = useState<SerialPortEntry[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPorts = useCallback(async () => {
    if (!hasWebSerial()) return
    setLoading(true)
    setError(null)
    try {
      const list = await getPorts()
      setPortEntries(list)
      if (list.length > 0 && selectedIndex >= list.length) {
        setSelectedIndex(0)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load ports.')
      setPortEntries([])
    } finally {
      setLoading(false)
    }
  }, [selectedIndex])

  useEffect(() => {
    if (open) loadPorts()
  }, [open, loadPorts])

  const handleSelectDevice = useCallback(async () => {
    if (!hasWebSerial()) return
    setLoading(true)
    setError(null)
    try {
      const entry = await requestPort()
      if (entry) {
        setPortEntries((prev) => {
          const exists = prev.some((e) => e.port === entry.port)
          if (exists) return prev
          const next = [...prev, entry]
          setTimeout(() => setSelectedIndex(next.length - 1), 0)
          return next
        })
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'NotFoundError') {
        setError(e.message || 'Could not select device.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConnect = () => {
    const entry = portEntries[selectedIndex]
    if (entry) {
      onConnect(entry.port, entry.label)
      onClose()
    }
  }

  if (!open) return null

  if (!hasWebSerial()) {
    return (
      <div className="connect-dialog-overlay" onClick={onClose}>
        <div className="connect-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="connect-dialog-header">
            <h3>Connect Board</h3>
            <button type="button" className="connect-dialog-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
          <div className="connect-dialog-body">
            <p className="connect-dialog-error">
              Port selection from this browser is not supported. Use Chrome or Edge and ensure the page is on HTTPS or localhost.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="connect-dialog-overlay" onClick={onClose}>
      <div className="connect-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="connect-dialog-header">
          <h3>Connect Board</h3>
          <button type="button" className="connect-dialog-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="connect-dialog-body">
          <p className="connect-dialog-hint">
            Select the serial port where your Arduino is connected. Click &quot;Select device&quot; to allow this site to access your board (browser will ask for permission).
          </p>
          {loading ? (
            <p className="connect-dialog-loading">Loading ports…</p>
          ) : error ? (
            <p className="connect-dialog-error">{error}</p>
          ) : null}
          {!loading && !error && (
            <div className="connect-dialog-ports" style={{ marginTop: '0.5rem' }}>
              {portEntries.length > 0 ? (
                <select
                  className="connect-dialog-select"
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.target.value))}
                  style={{ marginBottom: '0.75rem' }}
                >
                  {portEntries.map((entry, i) => (
                    <option key={i} value={i}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="connect-dialog-empty" style={{ marginBottom: '0.75rem' }}>
                  No ports yet. Click &quot;Select device&quot; below to choose your Arduino (browser will show a device picker).
                </p>
              )}
              <button
                type="button"
                className="connect-dialog-btn primary"
                onClick={handleSelectDevice}
                disabled={loading}
                style={{ alignSelf: 'flex-start' }}
              >
                {loading ? 'Opening…' : 'Select device'}
              </button>
            </div>
          )}
        </div>
        <div className="connect-dialog-footer">
          <button type="button" className="connect-dialog-btn secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="connect-dialog-btn primary"
            onClick={handleConnect}
            disabled={loading || portEntries.length === 0}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConnectDialog
