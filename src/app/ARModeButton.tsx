/**
 * AR Mode Button
 * Button to enter AR mode (only shown when WebXR AR is supported)
 */

import { useAppStore } from '../store/appStore'
import './ARModeButton.css'

export function ARModeButton() {
  const capabilities = useAppStore((state) => state.capabilities)
  const mode = useAppStore((state) => state.mode)
  const setMode = useAppStore((state) => state.setMode)

  // Only show if AR is supported and we're not already in AR mode
  if (!capabilities.supportsImmersiveAR || mode === 'ar') {
    return null
  }

  const handleEnterAR = () => {
    console.log('Enter AR button clicked')
    // For now, just update the mode
    // In Phase 5, we'll actually start the XR session
    setMode('ar')
  }

  return (
    <button className="ar-mode-button" onClick={handleEnterAR}>
      Enter AR
    </button>
  )
}
