import React, { useState, useEffect } from 'react'
import BlocklyWorkspace from './components/BlocklyWorkspace/BlocklyWorkspace'
import CodeViewer from './components/CodeViewer/CodeViewer'
import UploadManager from './components/UploadManager/UploadManager'
import ConnectDialog from './components/ConnectDialog/ConnectDialog'
import AdminPanel from './components/AdminPanel/AdminPanel'
import { projectApi } from './services/api/projectApi'
import { firmwareApi } from './services/api/firmwareApi'
import { kitApi } from './services/api/kitApi'
import { customBlockApi } from './services/api/customBlockApi'
import type { CustomBlock } from './types'
import './App.css'

function App() {
  const [workspaceXml, setWorkspaceXml] = useState<string>('')
  const [generatedCode, setGeneratedCode] = useState<string>('// Code will appear here...\n\n// Select a kit first, then drag blocks from the sidebar!')
  const [viewMode, setViewMode] = useState<'blocks' | 'code'>('blocks')
  const [selectedKitId, setSelectedKitId] = useState<string>('')
  const [kits, setKits] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [currentProjectName, setCurrentProjectName] = useState<string>('')
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [connectedPort, setConnectedPort] = useState<string | null>(null)
  const [connectedSerialPort, setConnectedSerialPort] = useState<SerialPort | null>(null)
  const [connectedPortLabel, setConnectedPortLabel] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [panelMode, setPanelMode] = useState<'user' | 'admin'>('user')
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([])

  const handleWorkspaceChange = async (xml: string, _generatedJsCode?: string) => {
    setWorkspaceXml(xml)
    // Don't overwrite real code when blocks change — so Upload stays enabled for last generated code.
    // Only set placeholder when current code is already a placeholder (user never ran or cleared).
    if (xml && xml.trim()) {
      setGeneratedCode((prev) => {
        const isPlaceholder = !prev || prev.includes('Run to generate') || prev.includes('// Code will appear here')
        if (isPlaceholder) {
          return '// Your blocks are ready.\n// Click "Run" (header) to generate Arduino code from backend.\n\nvoid setup() {\n  // Run to generate\n}\n\nvoid loop() {\n  // Run to generate\n}'
        }
        return prev // keep last generated code so Upload button stays enabled
      })
    } else {
      setGeneratedCode('// Code will appear here...\n\n// Select a kit first, then drag blocks and click Run!')
    }
  }

  // Load kits on mount
  useEffect(() => {
    const loadKits = async () => {
      try {
        const kitsList = await kitApi.getAll()
        if (Array.isArray(kitsList)) {
          setKits(kitsList)
        } else {
          setKits([])
        }
      } catch (err) {
        console.error('Error loading kits:', err)
        setError('Failed to load kits. Make sure backend is running!')
        setKits([])
      }
    }
    loadKits()
  }, [])

  // Load custom blocks on mount (v0.6)
  useEffect(() => {
    const load = async () => {
      try {
        const list = await customBlockApi.list()
        setCustomBlocks(Array.isArray(list) ? list : [])
      } catch {
        setCustomBlocks([])
      }
    }
    load()
  }, [])

  // Close file menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown')) {
        setShowFileMenu(false)
      }
    }
    if (showFileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFileMenu])

  // Load sample XML when kit is first selected (kit-first flow)
  useEffect(() => {
    if (!selectedKitId || workspaceXml) return // Only load if kit selected and workspace empty
    
    const sampleXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="controls_whileUntil" x="20" y="20">
    <field name="MODE">WHILE</field>
    <value name="CONDITION">
      <block type="logic_boolean">
        <field name="BOOL">TRUE</field>
      </block>
    </value>
    <statement name="DO">
      <block type="led_on">
        <field name="PIN">13</field>
        <next>
          <block type="delay_ms">
            <field name="DURATION">500</field>
            <next>
              <block type="led_off">
                <field name="PIN">13</field>
                <next>
                  <block type="delay_ms">
                    <field name="DURATION">500</field>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`
    
    console.log('📦 Loading sample XML for kit:', selectedKitId)
    setWorkspaceXml(sampleXml)
    setTimeout(() => {
      handleWorkspaceChange(sampleXml)
    }, 100)
  }, [selectedKitId])

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsList = await projectApi.getAll()
        setProjects(projectsList as any[])
      } catch (err) {
        console.error('Error loading projects:', err)
      }
    }
    loadProjects()
  }, [])

  // Handle kit selection
  const handleKitChange = (kitId: string) => {
    setSelectedKitId(kitId)
    setError(null)
  }

  // Run = Generate + Assemble
  const handleRun = async () => {
    if (!selectedKitId) {
      setError('Please select a kit first!')
      return
    }
    if (!workspaceXml?.trim()) {
      setError('Please create blocks first!')
      return
    }

    setIsLoading(true)
    setError(null)
    setIsRunning(true)

    try {
      // Generate code
      const result = await firmwareApi.generateCode({
        blockXml: workspaceXml.trim(),
        kitId: selectedKitId,
      })
      
      // Assemble firmware
      const assembleResult = await firmwareApi.assemble(workspaceXml.trim(), selectedKitId)
      setGeneratedCode(assembleResult.firmware || result.code || '// No code generated')
      setViewMode('code')
      setError(null)
    } catch (err: any) {
      console.error('Error running:', err)
      setError(`Failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsRunning(false)
    }
  }

  // Stop (placeholder for now)
  const handleStop = () => {
    setIsRunning(false)
    // Future: stop execution if running
  }

  // File menu handlers
  const handleNewProject = () => {
    if (confirm('Create new project? Current work will be lost if not saved.')) {
      setWorkspaceXml('')
      setGeneratedCode('// Code will appear here...\n\n// Select a kit first, then drag blocks from the sidebar!')
      setCurrentProjectName('')
      setCurrentProjectId(null)
      setViewMode('blocks')
      setError(null)
    }
    setShowFileMenu(false)
  }

  const handleSaveProject = async () => {
    if (!workspaceXml) {
      setError('No blocks to save!')
      setShowFileMenu(false)
      return
    }

    const projectName = currentProjectName || prompt('Enter project name:')
    if (!projectName) {
      setShowFileMenu(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let project
      if (currentProjectId) {
        // Update existing
        project = await projectApi.update(currentProjectId, {
          name: projectName,
          blocklyXml: workspaceXml,
          kitId: selectedKitId,
        } as any)
      } else {
        // Create new
        project = await projectApi.create({
          name: projectName,
          blocklyXml: workspaceXml,
          kitId: selectedKitId,
        } as any)
        setCurrentProjectId((project as any).id)
      }
      
      setCurrentProjectName(projectName)
      const projectsList = await projectApi.getAll()
      setProjects(projectsList as any[])
      setError(null)
    } catch (err: any) {
      console.error('Error saving project:', err)
      setError(`Save failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setShowFileMenu(false)
    }
  }

  const handleLoadProject = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const projectsList = await projectApi.getAll()
      setProjects(projectsList as any[])
      
      if (projectsList.length === 0) {
        alert('No projects found. Create a project first!')
      } else {
        const projectNames = projectsList.map((p: any, idx: number) => 
          `${idx + 1}. ${p.name}`
        ).join('\n')
        
        const selection = prompt(`Available projects:\n\n${projectNames}\n\nEnter project number to load:`)
        const index = parseInt(selection || '0') - 1
        
        if (index >= 0 && index < projectsList.length) {
          const project = projectsList[index] as any
          setWorkspaceXml(project.blockXml || '')
          setSelectedKitId(project.kitId || kits[0]?.id || '')
          setCurrentProjectId(project.id)
          setCurrentProjectName(project.name)
          setViewMode('blocks')
          alert(`✅ Project "${project.name}" loaded!`)
        }
      }
    } catch (err: any) {
      console.error('Error loading projects:', err)
      setError(`Load failed: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setShowFileMenu(false)
    }
  }

  // Download .ino
  const handleDownloadIno = () => {
    const code = generatedCode?.trim() || '// No code'
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Deltabotix_Blink.ino'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Kit selected check
  const isKitSelected = !!selectedKitId

  return (
    <div className="app">
      {/* Header Bar */}
      <header className="app-header-v3">
        <div className="header-left">
          <h1 className="logo">Deltabotix</h1>
        </div>
        
        <div className="header-center">
          {/* File Dropdown */}
          <div className="header-item dropdown">
            <button 
              className="header-btn"
              onClick={() => setShowFileMenu(!showFileMenu)}
            >
              File
            </button>
            {showFileMenu && (
              <div className="dropdown-menu">
                <button onClick={handleNewProject}>New</button>
                <button onClick={handleSaveProject}>Save</button>
                <button onClick={handleLoadProject}>Load</button>
              </div>
            )}
          </div>

          {/* Project Name */}
          <div className="header-item">
            <span className="project-name">
              {currentProjectName || 'Untitled Project'}
            </span>
          </div>

          {/* Kit Dropdown */}
          <div className="header-item">
            <select 
              value={selectedKitId} 
              onChange={(e) => handleKitChange(e.target.value)}
              className="kit-select"
            >
              <option value="">Select Kit</option>
              {kits.map((kit: any) => (
                <option key={kit.id} value={kit.id}>{kit.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-right">
          {/* Run */}
          <button 
            className="header-btn run-btn"
            onClick={handleRun}
            disabled={!isKitSelected || isLoading || !workspaceXml}
            title="Generate & Assemble"
          >
            ▶ Run
          </button>

          {/* Stop */}
          <button 
            className="header-btn stop-btn"
            onClick={handleStop}
            disabled={!isRunning}
            title="Stop"
          >
            ⏹ Stop
          </button>

          {/* Connect (Web Serial: port detected in browser) */}
          <button 
            className={`header-btn connect-btn ${connectedSerialPort || connectedPort ? 'connected' : ''}`}
            onClick={() => {
              if (connectedSerialPort || connectedPort) {
                setConnectedSerialPort(null)
                setConnectedPortLabel(null)
                setConnectedPort(null)
              } else {
                setShowConnectDialog(true)
              }
            }}
            disabled={!isKitSelected}
            title={connectedPortLabel || connectedPort ? `Disconnect (${connectedPortLabel || connectedPort})` : 'Connect Board'}
          >
            {connectedPortLabel || connectedPort ? `🔌 ${connectedPortLabel || connectedPort}` : '🔌 Connect'}
          </button>
          <ConnectDialog
            open={showConnectDialog}
            onClose={() => setShowConnectDialog(false)}
            onConnect={(port, label) => {
              setConnectedSerialPort(port)
              setConnectedPortLabel(label)
              setConnectedPort(label)
              setShowConnectDialog(false)
            }}
            currentPort={connectedPortLabel || connectedPort}
          />

          {/* Upload */}
          <button 
            className="header-btn upload-btn"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            disabled={!isKitSelected}
            title="Upload to Arduino"
          >
            ⬆ Upload
          </button>

          {/* User / Admin (v0.6) */}
          <div className="header-item toggle-group">
            <button
              className={`toggle-btn ${panelMode === 'user' ? 'active' : ''}`}
              onClick={() => setPanelMode('user')}
            >
              User
            </button>
            <button
              className={`toggle-btn ${panelMode === 'admin' ? 'active' : ''}`}
              onClick={() => setPanelMode('admin')}
            >
              Admin
            </button>
          </div>

          {/* Block/Code Toggle */}
          <div className="header-item toggle-group">
            <button
              className={`toggle-btn ${viewMode === 'blocks' ? 'active' : ''}`}
              onClick={() => setViewMode('blocks')}
              disabled={!isKitSelected}
            >
              Blocks
            </button>
            <button
              className={`toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
              onClick={() => setViewMode('code')}
            >
              &lt;/&gt; Code
            </button>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Main Content */}
      <main className="app-main-v3">
        {/* Admin Panel (v0.6) */}
        {panelMode === 'admin' && (
          <div className="admin-panel-wrap">
            <AdminPanel onBlocksChange={setCustomBlocks} />
          </div>
        )}

        {/* User: Upload Panel (toggleable) */}
        {panelMode === 'user' && showUploadPanel && (
          <div className="upload-panel">
            <div className="upload-panel-header">
              <span>Upload to Arduino</span>
              <button onClick={() => setShowUploadPanel(false)}>×</button>
            </div>
            <UploadManager 
              assembledCode={generatedCode} 
              selectedKitId={selectedKitId}
              connectedPort={connectedPortLabel || connectedPort}
              connectedSerialPort={connectedSerialPort}
            />
          </div>
        )}

        {/* Blocks or Code View (User only) */}
        {panelMode === 'user' && viewMode === 'blocks' ? (
          <div className={`workspace-container ${!isKitSelected ? 'disabled' : ''}`}>
            {!isKitSelected ? (
              <div className="kit-prompt">
                <h2>Select a Kit First</h2>
                <p>Choose your board/kit from the header dropdown to start coding.</p>
              </div>
            ) : (
              <BlocklyWorkspace
                initialXml={workspaceXml}
                onWorkspaceChange={handleWorkspaceChange}
                customBlocks={customBlocks}
              />
            )}
          </div>
        ) : panelMode === 'user' && viewMode === 'code' ? (
          <div className="code-container">
            <div className="code-toolbar">
              <button
                onClick={handleDownloadIno}
                disabled={!generatedCode || generatedCode.includes('// Code will appear') || generatedCode.includes('Run to generate')}
                className="download-btn"
              >
                📥 Download .ino
              </button>
            </div>
            <CodeViewer code={generatedCode} />
          </div>
        ) : null}
      </main>
    </div>
  )
}

export default App
