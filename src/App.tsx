/**
 * Main App Component
 * Phase 1: Mode detection and basic 3D scene
 */

import { useMemo } from 'react'
import { createXRStore } from '@react-three/xr'
import { ModeDetector } from './app/ModeDetector'
import { ModeLabel } from './app/ModeLabel'
import { ARModeButton } from './app/ARModeButton'
import { ExitARButton } from './app/ExitARButton'
import { StartARButton } from './app/StartARButton'
import { Settings } from './app/Settings'
import { ControlsHint } from './app/ControlsHint'
import { ProviderSelector } from './app/ProviderSelector'
import { SimulatedMode } from './app/SimulatedMode'
import { ARMode } from './app/ARMode'
import { useAppStore } from './store/appStore'
import './App.css'

function App() {
  const mode = useAppStore((state) => state.mode)
  const isARSessionActive = useAppStore((state) => state.isARSessionActive)

  // Create XR store (memoized to prevent recreation)
  const xrStore = useMemo(() => createXRStore(), [])

  return (
    <div className="App">
      {/* Detect XR capabilities on mount */}
      <ModeDetector />

      {/* UI Overlays */}
      <ModeLabel />
      <ARModeButton />
      <ExitARButton />
      <Settings />
      {/* <ControlsHint /> Hidden to avoid blocking AR button on mobile */}
      <ProviderSelector />

      {/* Start AR Button - shows when in AR mode but session not started */}
      {mode === 'ar' && !isARSessionActive && <StartARButton store={xrStore} />}

      {/* 3D Scene */}
      {mode === 'simulated' && <SimulatedMode />}
      {mode === 'ar' && <ARMode store={xrStore} />}
    </div>
  )
}

export default App
