import React, { useState, useEffect } from 'react'
import { customBlockApi } from '../../services/api/customBlockApi'
import type { CustomBlock, CustomBlockInput } from '../../types'
import './AdminPanel.css'

interface AdminPanelProps {
  onBlocksChange?: (blocks: CustomBlock[]) => void
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBlocksChange }) => {
  const [blocks, setBlocks] = useState<CustomBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [inputCount, setInputCount] = useState(2)
  const [inputs, setInputs] = useState<CustomBlockInput[]>([
    { name: 'pin', type: 'number' },
    { name: 'value', type: 'number' },
  ])
  const [template, setTemplate] = useState('digitalWrite(%1, %2);')
  const [saving, setSaving] = useState(false)

  const loadBlocks = async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await customBlockApi.list()
      const arr = Array.isArray(list) ? list : []
      setBlocks(arr)
      onBlocksChange?.(arr)
    } catch (e: any) {
      setError(e?.message || 'Failed to load custom blocks')
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBlocks()
  }, [])

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Block name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const toSend = inputs.slice(0, Math.max(1, inputCount))
      await customBlockApi.create({ name: name.trim(), inputs: toSend, template: template.trim() })
      setName('')
      setTemplate('digitalWrite(%1, %2);')
      await loadBlocks()
    } catch (e: any) {
      setError(e?.message || 'Failed to create block')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await customBlockApi.remove(id)
      await loadBlocks()
    } catch (e: any) {
      setError(e?.message || 'Failed to delete')
    }
  }

  const updateInput = (index: number, field: keyof CustomBlockInput, value: string | [string, string][]) => {
    setInputs((prev) => {
      const next = [...prev]
      if (!next[index]) next[index] = { name: '', type: 'number' }
      ;(next[index] as any)[field] = value
      return next
    })
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">Create Custom Block (Admin)</h2>
      <p className="admin-panel-desc">Custom blocks appear in &quot;My Blocks&quot; for all users. Use %1, %2 in the template for input values.</p>

      <form onSubmit={handleAddBlock} className="admin-form">
        <div className="form-group">
          <label>Block name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Set LED"
          />
        </div>
        <div className="form-group">
          <label>Number of inputs (1–4)</label>
          <select
            value={inputCount}
            onChange={(e) => setInputCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        {[0, 1, 2, 3].slice(0, inputCount).map((i) => (
          <div key={i} className="form-row">
            <input
              type="text"
              value={inputs[i]?.name ?? ''}
              onChange={(e) => updateInput(i, 'name', e.target.value)}
              placeholder={`Input ${i + 1} name`}
            />
            <select
              value={inputs[i]?.type ?? 'number'}
              onChange={(e) => updateInput(i, 'type', e.target.value as 'number' | 'text' | 'dropdown')}
            >
              <option value="number">Number</option>
              <option value="text">Text</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>
        ))}
        <div className="form-group">
          <label>Arduino code template (%1 = first input, %2 = second, …)</label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={4}
            placeholder="digitalWrite(%1, %2);"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Add Custom Block'}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}

      <h3 className="admin-list-title">Custom blocks</h3>
      {loading ? (
        <p>Loading…</p>
      ) : blocks.length === 0 ? (
        <p className="admin-empty">No custom blocks yet. Create one above.</p>
      ) : (
        <ul className="admin-block-list">
          {blocks.map((b) => (
            <li key={b.id} className="admin-block-item">
              <span><strong>{b.name}</strong> — {b.inputs?.length ?? 0} input(s)</span>
              <button type="button" className="btn btn-small" onClick={() => handleDelete(b.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AdminPanel
