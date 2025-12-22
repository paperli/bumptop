/**
 * OAuth Callback Handler
 * Handles redirect from Dropbox authorization
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useFileStore } from '../store/fileStore'
import { DropboxProvider } from '../fs/DropboxProvider'
import { getOAuthState, getCodeVerifier, clearOAuthState } from '../utils/tokenStorage'
import './AuthCallback.css'

type CallbackState = 'processing' | 'success' | 'error'

export function AuthCallback() {
  const navigate = useNavigate()
  const [state, setState] = useState<CallbackState>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const authStore = useAuthStore()

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    console.log('[AuthCallback] Processing OAuth callback')

    try {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const error = params.get('error')
      const errorDescription = params.get('error_description')

      // Check for errors from Dropbox
      if (error) {
        throw new Error(errorDescription || error)
      }

      // Validate required parameters
      if (!code) {
        throw new Error('Authorization code missing')
      }

      if (!state) {
        throw new Error('State parameter missing')
      }

      // Validate state (CSRF protection) - retrieve from sessionStorage
      const storedState = getOAuthState()
      if (!storedState) {
        throw new Error('Stored state missing - session may have expired')
      }
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack')
      }

      // Get code verifier from sessionStorage
      const codeVerifier = getCodeVerifier()
      if (!codeVerifier) {
        throw new Error('Code verifier missing - session may have expired')
      }

      console.log('[AuthCallback] State validated, exchanging code for token...')

      // Exchange code for token
      const provider = new DropboxProvider()
      await provider.exchangeCodeForToken(code, codeVerifier)

      // Clear OAuth state from both sessionStorage and authStore
      clearOAuthState()
      authStore.clearOAuthState()

      // Set provider and load files
      const { setProvider, loadFiles } = useFileStore.getState()
      setProvider(provider)

      console.log('[AuthCallback] ✓ Authentication successful, loading files...')

      // Load files in background (don't await)
      loadFiles().catch(err => {
        console.error('[AuthCallback] Failed to load files:', err)
      })

      // Show success state
      setState('success')

      // Redirect after short delay
      setTimeout(() => {
        console.log('[AuthCallback] Redirecting to main app...')
        navigate('/')
      }, 1500)
    } catch (error) {
      console.error('[AuthCallback] Error:', error)
      const message = error instanceof Error ? error.message : 'Authentication failed'
      setErrorMessage(message)
      authStore.setAuthError(message)
      clearOAuthState()
      authStore.clearOAuthState()
      setState('error')

      // Redirect to home after error
      setTimeout(() => {
        navigate('/')
      }, 3000)
    }
  }

  return (
    <div className="auth-callback">
      <div className="auth-callback-card">
        {state === 'processing' && (
          <>
            <div className="spinner"></div>
            <h2>Authenticating...</h2>
            <p>Please wait while we complete the sign-in process.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="checkmark">✓</div>
            <h2>Success!</h2>
            <p>You've been signed in. Redirecting...</p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Authentication Failed</h2>
            <p>{errorMessage}</p>
            <p className="redirect-notice">Redirecting to home...</p>
          </>
        )}
      </div>
    </div>
  )
}
