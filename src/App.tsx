/**
 * Main App Component
 * Phase 1: Mode detection and basic 3D scene
 */

import { ModeDetector } from './app/ModeDetector'
import { ModeLabel } from './app/ModeLabel'
import { ARModeButton } from './app/ARModeButton'
import { Settings } from './app/Settings'
import { SimulatedMode } from './app/SimulatedMode'
import { useAppStore } from './store/appStore'
import './App.css'

function App() {
  const mode = useAppStore((state) => state.mode)

  return (
    <div className="App">
      {/* Detect XR capabilities on mount */}
      <ModeDetector />

      {/* UI Overlays */}
      <ModeLabel />
      <ARModeButton />
      <Settings />

      {/* 3D Scene */}
      {mode === 'simulated' && <SimulatedMode />}
      {mode === 'ar' && (
        <div className="ar-placeholder">
          <h2>AR Mode</h2>
          <p>AR session will be implemented in Phase 5</p>
          <button onClick={() => useAppStore.getState().setMode('simulated')}>
            Exit AR (Back to Simulated)
          </button>
        </div>
      )}
    </div>
  )
}

export default App
