import React, { useEffect, useRef } from 'react'
import * as Blockly from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import { registerLedBlocks } from './ledBlocks'
import { registerInputBlocks } from './inputBlocks'
import type { CustomBlock } from '../../types'
import './BlocklyWorkspace.css'

// Register built-in blocks once
registerLedBlocks()
registerInputBlocks()

function buildCustomBlockDef(cb: CustomBlock): object {
  const n = Math.max(1, (cb.inputs && cb.inputs.length) || 0)
  const args0: object[] = []
  for (let i = 0; i < n; i++) {
    const inp = cb.inputs && cb.inputs[i]
    const name = 'INPUT' + i
    if (inp?.type === 'number') {
      args0.push({ type: 'field_number', name, value: 0, min: 0, max: 999 })
    } else if (inp?.type === 'text') {
      args0.push({ type: 'field_input', name, text: '' })
    } else {
      args0.push({ type: 'field_dropdown', name, options: (inp?.options && inp.options.length) ? inp.options : [['Option', 'opt1']] })
    }
  }
  const percents = args0.map((_, i) => '%' + (i + 1)).join(' ')
  return {
    type: 'custom_' + cb.id,
    message0: (cb.name || 'Custom') + ' ' + percents,
    args0,
    previousStatement: true,
    nextStatement: true,
    colour: 290,
    tooltip: cb.template ? 'Custom: ' + cb.template.split('\n')[0] : 'Custom block',
  }
}

function buildToolboxContents(customBlocks: CustomBlock[]): object[] {
  const base = [
    { kind: 'category', name: '🔌 Output (LED)', colour: '320', contents: [{ kind: 'block', type: 'led_on' }, { kind: 'block', type: 'led_off' }, { kind: 'block', type: 'delay_ms' }] },
    { kind: 'category', name: '📥 Input', colour: '260', contents: [{ kind: 'block', type: 'digital_read' }, { kind: 'block', type: 'analog_read' }] },
    { kind: 'category', name: 'Logic', colour: '210', contents: [{ kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_operation' }, { kind: 'block', type: 'logic_negate' }, { kind: 'block', type: 'logic_boolean' }] },
    { kind: 'category', name: 'Loops', colour: '120', contents: [{ kind: 'block', type: 'controls_repeat_ext' }, { kind: 'block', type: 'controls_whileUntil' }, { kind: 'block', type: 'controls_for' }] },
    { kind: 'category', name: 'Math', colour: '230', contents: [{ kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' }, { kind: 'block', type: 'math_random_int' }] },
    { kind: 'category', name: 'Text', colour: '160', contents: [{ kind: 'block', type: 'text' }, { kind: 'block', type: 'text_join' }, { kind: 'block', type: 'text_length' }] },
    { kind: 'category', name: 'Variables', custom: 'VARIABLE', colour: '330' },
    { kind: 'category', name: 'Functions', custom: 'PROCEDURE', colour: '290' },
  ]
  if (customBlocks && customBlocks.length > 0) {
    const myBlocks = { kind: 'category' as const, name: 'My Blocks', colour: '290', contents: customBlocks.map((cb) => ({ kind: 'block' as const, type: 'custom_' + cb.id })) }
    return [myBlocks, ...base]
  }
  return base
}

export interface BlocklyWorkspaceProps {
  initialXml?: string
  onWorkspaceChange: (xml: string, generatedJsCode?: string) => void
  customBlocks?: CustomBlock[]
}

const BlocklyWorkspace: React.FC<BlocklyWorkspaceProps> = ({
  initialXml = '',
  onWorkspaceChange,
  customBlocks = [],
}) => {
  const blocklyDiv = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const skipNextSyncRef = useRef(false)

  useEffect(() => {
    const div = blocklyDiv.current
    if (!div) return

    let cancelled = false
    const run = () => {
      if (cancelled || !blocklyDiv.current) return
      const el = blocklyDiv.current

    // Define custom block types one-by-one; only use blocks that defined successfully (avoids toolbox referencing undefined type)
    const list = customBlocks || []
    const definedIds: string[] = []
    list.forEach((cb) => {
      try {
        const def = buildCustomBlockDef(cb)
        ;(Blockly.common.defineBlocksWithJsonArray as (arr: object[]) => void)([def])
        if (javascriptGenerator.forBlock) (javascriptGenerator.forBlock as any)[(def as any).type] = () => ''
        definedIds.push(cb.id)
      } catch (_) {
        // Block type may already exist or def invalid; skip so we don't add to toolbox
      }
    })
    const blocksForToolbox = list.filter((cb) => definedIds.includes(cb.id))

    let xmlToRestore = ''
    if (workspaceRef.current) {
      try {
        xmlToRestore = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspaceRef.current))
      } catch (_) {}
      workspaceRef.current.dispose()
      workspaceRef.current = null
    }

    const toolboxContents = buildToolboxContents(blocksForToolbox)
    const toolbox = { kind: 'categoryToolbox' as const, contents: toolboxContents }

    let workspace: Blockly.WorkspaceSvg
    try {
      workspace = Blockly.inject(el, {
      toolbox,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      media: 'https://unpkg.com/blockly/media/',
      sounds: true,
      renderer: 'geras',
      theme: Blockly.Themes.Classic,
    })
      } catch (err) {
      console.error('Blockly inject failed, retrying without custom blocks:', err)
      try {
        workspace = Blockly.inject(el, {
          toolbox: { kind: 'categoryToolbox' as const, contents: buildToolboxContents([]) },
          grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
          zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
          trashcan: true,
          media: 'https://unpkg.com/blockly/media/',
          sounds: true,
          renderer: 'geras',
          theme: Blockly.Themes.Classic,
        })
      } catch (fallbackErr) {
        console.error('Blockly inject fallback failed:', fallbackErr)
        return
      }
    }

    workspaceRef.current = workspace

    // Load XML: prefer restored (after toolbox update), else initialXml
    const toLoad = xmlToRestore || initialXml
    if (toLoad) {
      try {
        const xml = Blockly.utils.xml.textToDom(toLoad)
        Blockly.Xml.domToWorkspace(xml, workspace)
      } catch (error) {
        console.error('Error loading XML:', error)
      }
    }

    // Listen to workspace changes
    workspace.addChangeListener((event) => {
      if (
        event.type === Blockly.Events.BLOCK_CREATE ||
        event.type === Blockly.Events.BLOCK_DELETE ||
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE
      ) {
        try {
          skipNextSyncRef.current = true
          const xml = Blockly.Xml.workspaceToDom(workspace)
          const xmlText = Blockly.Xml.domToText(xml)
          
          // Generate JavaScript code from blocks
          let generatedJsCode = ''
          try {
            generatedJsCode = javascriptGenerator.workspaceToCode(workspace)
            console.log('Generated JavaScript code:', generatedJsCode)
          } catch (error) {
            console.error('Code generation error:', error)
          }
          
          // Pass both XML and generated code to parent
          onWorkspaceChange(xmlText, generatedJsCode)
        } catch (error) {
          console.error('Error processing workspace change:', error)
        }
      }
    })

    }

    const id = requestAnimationFrame(run)
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
      if (workspaceRef.current) {
        try { workspaceRef.current.dispose() } catch (_) {}
        workspaceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customBlocks])

  // Update workspace only when initialXml changes from outside (e.g. Load Project), not after our own drag/change
  useEffect(() => {
    if (!workspaceRef.current) return
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false
      return
    }
    if (!initialXml || initialXml.trim().length === 0) {
      console.log('⚠️ No initial XML provided')
      return
    }

    try {
      // Clear existing blocks
      workspaceRef.current.clear()
      
      // Load new XML
      const xml = Blockly.utils.xml.textToDom(initialXml)
      Blockly.Xml.domToWorkspace(xml, workspaceRef.current)
      
      // Trigger change event to update parent
      const xmlText = Blockly.Xml.workspaceToDom(workspaceRef.current)
      const xmlString = Blockly.Xml.domToText(xmlText)
      onWorkspaceChange(xmlString)
      
      console.log('✅ Workspace XML loaded:', { length: xmlString.length })
    } catch (error) {
      console.error('❌ Error updating workspace XML:', error)
    }
  }, [initialXml, onWorkspaceChange])

  return (
    <div className="blockly-workspace-container">
      <div style={{ 
        padding: '0.5rem 1rem', 
        background: 'white', 
        borderBottom: '1px solid #ddd',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        💡 Tip: Drag blocks from the left sidebar to create your program!
      </div>
      <div ref={blocklyDiv} className="blockly-workspace" />
    </div>
  )
}

export default BlocklyWorkspace
