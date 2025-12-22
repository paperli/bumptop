/**
 * Exit AR Button
 * Button to exit AR mode and return to simulated mode
 * Only shown when in AR mode
 */

import { useAppStore } from '../store/appStore'
import './ExitARButton.css'

export function ExitARButton() {
  const mode = useAppStore((state) => state.mode)
  const isARSessionActive = useAppStore((state) => state.isARSessionActive)
  const setMode = useAppStore((state) => state.setMode)

  // Only show if in AR mode and session is active
  if (mode !== 'ar' || !isARSessionActive) {
    return null
  }

  const handleExitAR = () => {
    console.log('[ExitARButton] User clicked Exit AR')
    // Setting mode to 'simulated' will unmount ARMode component
    // which will trigger cleanup and properly end the XR session
    setMode('simulated')
  }

  return (
    <button className="exit-ar-button" onClick={handleExitAR}>
      Exit AR
    </button>
  )
}
