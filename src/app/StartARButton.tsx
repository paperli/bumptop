/**
 * Start AR Button
 * Shows after AR mode Canvas is loaded, triggers the XR session
 * This ensures the XR store is connected before calling enterAR()
 */

import { useState, useEffect } from 'react'
import { XRStore } from '@react-three/xr'
import { useAppStore } from '../store/appStore'
import './StartARButton.css'

interface StartARButtonProps {
  store: XRStore
}

export function StartARButton({ store }: StartARButtonProps) {
  const [loading, setLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const setARSessionActive = useAppStore((state) => state.setARSessionActive)
  const setMode = useAppStore((state) => state.setMode)
  const isARSessionActive = useAppStore((state) => state.isARSessionActive)

  // Wait for XR Canvas to be ready
  useEffect(() => {
    const waitTime = 1000 // Fixed 1 second wait
    console.log(`[StartARButton] Waiting ${waitTime}ms for XR Canvas to be ready...`)

    setError(null)
    setIsReady(false)

    const timer = setTimeout(() => {
      console.log('[StartARButton] ✓ Enabling button')
      setIsReady(true)
    }, waitTime)

    return () => clearTimeout(timer)
  }, [store, retryCount])

  // Hide button if AR session is already active
  if (isARSessionActive) {
    return null
  }

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    console.log('[StartARButton] User clicked Start AR, requesting XR session...')

    try {
      await store.enterAR()
      console.log('[StartARButton] ✓ AR session started successfully')
      setARSessionActive(true)
    } catch (error) {
      console.error('[StartARButton] ✗ Failed to start AR:', error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[StartARButton] Error details:', errorMessage)

      setError(errorMessage)
      setLoading(false)
    }
  }

  const handleRetry = () => {
    console.log('[StartARButton] User clicked Retry')
    setRetryCount(prev => prev + 1)
    setError(null)
  }

  return (
    <div className="start-ar-overlay">
      <div className="start-ar-content">
        <h2>{error ? '⚠️ AR Failed' : 'Ready for AR'}</h2>
        <p>
          {error
            ? 'Canvas not ready yet. Try waiting longer.'
            : 'Start the AR session to view your files in augmented reality'}
        </p>

        {error && (
          <div style={{
            padding: '12px',
            background: 'rgba(255, 59, 48, 0.2)',
            border: '1px solid rgba(255, 59, 48, 0.5)',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#ff3b30',
            wordBreak: 'break-word',
          }}>
            {error}
          </div>
        )}

        {error ? (
          <button
            className="start-ar-button"
            onClick={handleRetry}
            style={{ background: 'linear-gradient(135deg, #ff9500 0%, #ff3b30 100%)' }}
          >
            🔄 Retry (attempt {retryCount + 1})
          </button>
        ) : (
          <button
            className="start-ar-button"
            onClick={handleStart}
            disabled={loading || !isReady}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Starting AR...
              </>
            ) : !isReady ? (
              <>
                <span className="spinner"></span>
                Preparing Canvas...
              </>
            ) : (
              <>
                📷 Start AR Session
              </>
            )}
          </button>
        )}

        <button
          className="cancel-ar-button"
          onClick={() => setMode('simulated')}
          disabled={loading}
        >
          {error ? 'Back to Simulated' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
