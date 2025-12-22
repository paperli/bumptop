/**
 * Mode Detector Component
 * Detects WebXR capabilities on mount and updates app store
 */

import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { detectXRCapabilities, logSystemInfo } from '../utils/xrHelpers'

export function ModeDetector() {
  const setCapabilities = useAppStore((state) => state.setCapabilities)
  const setMode = useAppStore((state) => state.setMode)

  useEffect(() => {
    // Log system info for debugging
    logSystemInfo()

    // Detect XR capabilities
    detectXRCapabilities().then((capabilities) => {
      console.log('Detected capabilities:', capabilities)
      setCapabilities(capabilities)

      // Auto-select mode based on capabilities
      if (capabilities.supportsImmersiveAR) {
        console.log('AR mode available - staying in simulated mode until user enters AR')
        // Keep in simulated mode by default, user can click button to enter AR
      } else {
        console.log('AR mode not available - using simulated mode')
        setMode('simulated')
      }
    })
  }, [setCapabilities, setMode])

  // This component doesn't render anything
  return null
}
