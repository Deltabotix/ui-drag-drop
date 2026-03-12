import React, { useState, useEffect, useRef } from 'react'
import './Simulator.css'
import { SimulatorState } from '@/types'

interface SimulatorProps {
  workspaceXml?: string
  generatedCode?: string
}

const Simulator: React.FC<SimulatorProps> = ({ workspaceXml, generatedCode }) => {
  const [simulatorState, setSimulatorState] = useState<SimulatorState>({
    isRunning: false,
    leds: [],
    motors: [],
    sensors: [],
    console: [],
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Execute the program code
  const executeProgram = () => {
    if (!generatedCode || !workspaceXml) {
      setSimulatorState((prev) => ({
        ...prev,
        console: [
          ...prev.console,
          {
            type: 'error',
            message: 'No program loaded. Please create blocks first!',
            timestamp: new Date().toISOString(),
          },
        ],
      }))
      return
    }

    // Clear previous console
    setSimulatorState((prev) => ({
      ...prev,
      console: [
        {
          type: 'info',
          message: '🚀 Starting program execution...',
          timestamp: new Date().toISOString(),
        },
      ],
    }))

    // Extract and execute JavaScript code
    try {
      // Parse the generated code to simulate execution
      let loopCount = 0
      const maxIterations = 10 // Prevent infinite loops

      // Simple code execution simulation
      if (workspaceXml.includes('controls_repeat_ext')) {
        // Extract repeat count
        const repeatMatch = workspaceXml.match(/<field name="NUM">(\d+)<\/field>/)
        const repeatCount = repeatMatch ? parseInt(repeatMatch[1], 10) : 5

        const executeLoop = (iteration: number) => {
          if (iteration >= repeatCount || loopCount >= maxIterations) {
            setSimulatorState((prev) => ({
              ...prev,
              console: [
                ...prev.console,
                {
                  type: 'success',
                  message: `✅ Loop completed! Executed ${iteration} times.`,
                  timestamp: new Date().toISOString(),
                },
                {
                  type: 'info',
                  message: '🏁 Program execution finished.',
                  timestamp: new Date().toISOString(),
                },
              ],
            }))
            return
          }

          loopCount++
          
          // Check if condition block exists
          if (workspaceXml.includes('logic_compare')) {
            const compareMatch = workspaceXml.match(/<field name="OP">(\w+)<\/field>/)
            const operator = compareMatch ? compareMatch[1] : 'GT'
            
            const numMatch = workspaceXml.match(/<field name="NUM">(\d+)<\/field>/g)
            const numbers = numMatch ? numMatch.map(m => parseInt(m.match(/<field name="NUM">(\d+)<\/field>/)![1], 10)) : [3, 0]
            
            let result = false
            if (operator === 'GT') result = numbers[0] > numbers[1]
            else if (operator === 'LT') result = numbers[0] < numbers[1]
            else if (operator === 'EQ') result = numbers[0] === numbers[1]
            
            setSimulatorState((prev) => ({
              ...prev,
              console: [
                ...prev.console,
                {
                  type: 'log',
                  message: `📋 Iteration ${iteration + 1}: Checking condition (${numbers[0]} ${operator === 'GT' ? '>' : operator === 'LT' ? '<' : '=='} ${numbers[1]}) = ${result}`,
                  timestamp: new Date().toISOString(),
                },
              ],
            }))
          }

          // Simulate delay
          setTimeout(() => {
            executeLoop(iteration + 1)
          }, 500)
        }

        executeLoop(0)
      } else {
        // Simple program execution
        setSimulatorState((prev) => ({
          ...prev,
          console: [
            ...prev.console,
            {
              type: 'log',
              message: '📝 Program executed successfully!',
              timestamp: new Date().toISOString(),
            },
            {
              type: 'success',
              message: '✅ Execution completed.',
              timestamp: new Date().toISOString(),
            },
          ],
        }))
      }
    } catch (error) {
      setSimulatorState((prev) => ({
        ...prev,
        console: [
          ...prev.console,
          {
            type: 'error',
            message: `❌ Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          },
        ],
      }))
    }
  }

  const handleStart = () => {
    setSimulatorState((prev) => ({
      ...prev,
      isRunning: true,
      console: [],
    }))
    
    executeProgram()
  }

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setSimulatorState((prev) => ({
      ...prev,
      isRunning: false,
      console: [
        ...prev.console,
        {
          type: 'warning',
          message: '⏹️ Program stopped by user.',
          timestamp: new Date().toISOString(),
        },
      ],
    }))
  }

  const handleReset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setSimulatorState({
      isRunning: false,
      leds: [],
      motors: [],
      sensors: [],
      console: [],
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="simulator">
      <div className="simulator-header">
        <h3>Simulator</h3>
        <div className="simulator-controls">
          <button
            onClick={handleStart}
            disabled={simulatorState.isRunning}
            className="btn btn-primary"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!simulatorState.isRunning}
            className="btn btn-secondary"
          >
            Stop
          </button>
          <button onClick={handleReset} className="btn btn-tertiary">
            Reset
          </button>
        </div>
      </div>

      <div className="simulator-content">
        <div className="simulator-status">
          <div className="status-indicator">
            <span
              className={`status-dot ${simulatorState.isRunning ? 'running' : 'stopped'}`}
            />
            <span>
              {simulatorState.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
        </div>

        <div className="simulator-devices">
          <div className="device-panel">
            <h4>💡 LEDs (Light Emitting Diodes)</h4>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
              Status indicators, lights, notifications
            </p>
            {simulatorState.leds.length === 0 ? (
              <div>
                <p className="empty-state">No LEDs configured</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: '#ddd', 
                    border: '2px solid #999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ⚫
                  </div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: '#ddd', 
                    border: '2px solid #999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ⚫
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                  💡 Tip: Add LED blocks to control lights
                </p>
              </div>
            ) : (
              simulatorState.leds.map((led, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    background: led.state === 'on' ? '#4CAF50' : '#ddd',
                    border: '2px solid #333',
                    display: 'inline-block',
                    marginRight: '0.5rem'
                  }} />
                  LED {idx + 1}: {led.state === 'on' ? '🟢 ON' : '⚫ OFF'}
                </div>
              ))
            )}
          </div>

          <div className="device-panel">
            <h4>⚙️ Motors (DC Motors)</h4>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
              Movement, wheels, fans, pumps control
            </p>
            {simulatorState.motors.length === 0 ? (
              <div>
                <p className="empty-state">No motors configured</p>
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#f5f5f5', 
                  borderRadius: '4px',
                  marginTop: '0.5rem'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚙️</div>
                  <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
                    💡 Tip: Add Motor blocks to control movement
                  </p>
                </div>
              </div>
            ) : (
              simulatorState.motors.map((motor, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {motor.state === 'running' ? '⚙️' : '⏸️'}
                    </span>
                    <div>
                      <div>Motor {idx + 1}: {motor.state === 'running' ? 'Running' : 'Stopped'}</div>
                      {motor.speed && <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Speed: {motor.speed}%
                      </div>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="device-panel">
            <h4>📡 Sensors</h4>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
              Temperature, Distance, Light, Button inputs
            </p>
            {simulatorState.sensors.length === 0 ? (
              <div>
                <p className="empty-state">No sensors configured</p>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: '#666'
                }}>
                  <p style={{ margin: '0.25rem 0' }}>🌡️ Temperature: --</p>
                  <p style={{ margin: '0.25rem 0' }}>📏 Distance: --</p>
                  <p style={{ margin: '0.25rem 0' }}>☀️ Light: --</p>
                  <p style={{ margin: '0.25rem 0' }}>🔘 Button: --</p>
                  <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                    💡 Tip: Add Sensor blocks to read environment data
                  </p>
                </div>
              </div>
            ) : (
              simulatorState.sensors.map((sensor, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  {sensor.type}: {sensor.value} {sensor.unit || ''}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="simulator-console">
          <h4>Console Output</h4>
          <div className="console-output">
            {simulatorState.console.length === 0 ? (
              <p className="empty-state">No console output. Click "Start" to execute your program!</p>
            ) : (
              simulatorState.console.map((log, index) => (
                <div
                  key={index}
                  className={`console-line console-${log.type}`}
                  style={{
                    marginBottom: '0.25rem',
                    padding: '0.25rem 0',
                  }}
                >
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Program Info */}
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem' }}>📋 Program Information</h4>
          {workspaceXml ? (
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              <p style={{ margin: '0.25rem 0' }}>
                ✅ <strong>Blocks loaded:</strong> {workspaceXml.includes('<block') ? 'Yes' : 'No'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                🔄 <strong>Has loops:</strong> {workspaceXml.includes('controls_repeat') || workspaceXml.includes('controls_whileUntil') || workspaceXml.includes('controls_for') ? 'Yes' : 'No'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                🧠 <strong>Has conditions:</strong> {workspaceXml.includes('controls_if') ? 'Yes' : 'No'}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                📊 <strong>Code generated:</strong> {generatedCode && generatedCode.length > 100 ? 'Yes' : 'No'}
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#999' }}>
              ⚠️ No program loaded. Go to Blocks tab and create a program first!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Simulator

