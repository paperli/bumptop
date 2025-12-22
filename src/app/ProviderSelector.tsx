/**
 * Provider Selector Component
 * Allows switching between Mock and Dropbox file providers
 */

import { useState, useEffect } from 'react'
import { useFileStore } from '../store/fileStore'
import { useAuthStore } from '../store/authStore'
import { MockProvider } from '../fs/MockProvider'
import { DropboxProvider } from '../fs/DropboxProvider'
import './ProviderSelector.css'

type ProviderType = 'mock' | 'dropbox'

export function ProviderSelector() {
  const fileStore = useFileStore()
  const authStore = useAuthStore()
  const [selectedProvider, setSelectedProvider] = useState<ProviderType>('mock')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize auth state from sessionStorage on mount
  useEffect(() => {
    authStore.initialize()
  }, [])

  // Update selected provider when fileStore changes
  useEffect(() => {
    const currentProvider = fileStore.provider
    if (currentProvider) {
      setSelectedProvider(currentProvider.id as ProviderType)
    }
  }, [fileStore.provider])

  // Restore Dropbox provider if authenticated on mount
  useEffect(() => {
    if (authStore.isAuthenticated) {
      // If authenticated but provider is not Dropbox, switch to it
      const currentProvider = fileStore.provider
      if (!currentProvider || currentProvider.id !== 'dropbox') {
        console.log('[ProviderSelector] Restoring Dropbox provider from session')

        // Set loading state
        setIsLoading(true)

        const provider = new DropboxProvider()
        setSelectedProvider('dropbox')
        fileStore.setProvider(provider)

        // Load files and wait for completion
        fileStore.loadFiles()
          .then(() => {
            console.log('[ProviderSelector] ✓ Dropbox files restored successfully')
            setIsLoading(false)
          })
          .catch(err => {
            console.error('[ProviderSelector] Failed to load files on restore:', err)
            setIsLoading(false)
            authStore.setAuthError('Failed to load files from Dropbox')
          })
      } else {
        // Already has Dropbox provider, just update UI
        setSelectedProvider('dropbox')
      }
    }
  }, [authStore.isAuthenticated])

  const handleProviderChange = async (providerType: ProviderType) => {
    if (providerType === selectedProvider) return

    console.log(`[ProviderSelector] Switching to ${providerType} provider`)
    setIsLoading(true)

    try {
      if (providerType === 'mock') {
        // Switch to Mock provider
        const provider = new MockProvider()
        fileStore.setProvider(provider)
        await fileStore.loadFiles()
        setSelectedProvider('mock')
      } else if (providerType === 'dropbox') {
        // Check if already authenticated
        const provider = new DropboxProvider()
        setSelectedProvider('dropbox') // Always set to show sign-in button if not authenticated

        if (provider.isAuthenticated()) {
          // Already authenticated, just switch provider
          fileStore.setProvider(provider)
          await fileStore.loadFiles()
        }
        // If not authenticated, UI will show "Sign in" button
      }
    } catch (error) {
      console.error('[ProviderSelector] Failed to switch provider:', error)
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to switch provider')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    console.log('[ProviderSelector] Initiating Dropbox sign-in')
    const provider = new DropboxProvider()

    try {
      await provider.signIn()
      // Note: signIn() will redirect to Dropbox, so code below won't execute
    } catch (error) {
      console.error('[ProviderSelector] Sign-in error:', error)
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to sign in')
    }
  }

  const handleSignOut = async () => {
    console.log('[ProviderSelector] Signing out')
    const provider = new DropboxProvider()
    await provider.signOut()

    // Switch back to Mock provider
    await handleProviderChange('mock')
  }

  const handleRefresh = async () => {
    console.log('[ProviderSelector] Refreshing files from Dropbox')
    setIsLoading(true)
    try {
      await fileStore.loadFiles()
    } catch (error) {
      console.error('[ProviderSelector] Failed to refresh files:', error)
      authStore.setAuthError(error instanceof Error ? error.message : 'Failed to refresh files')
    } finally {
      setIsLoading(false)
    }
  }

  const isDropboxAuthenticated = selectedProvider === 'dropbox' && authStore.isAuthenticated

  return (
    <div className="provider-selector">
      <div className="provider-buttons">
        <button
          className={`provider-button ${selectedProvider === 'mock' ? 'active' : ''}`}
          onClick={() => handleProviderChange('mock')}
          disabled={isLoading}
        >
          📁 Mock Files
        </button>

        <button
          className={`provider-button ${selectedProvider === 'dropbox' ? 'active' : ''}`}
          onClick={() => handleProviderChange('dropbox')}
          disabled={isLoading || authStore.isAuthenticating}
        >
          📦 Dropbox
        </button>
      </div>

      {/* Dropbox auth status */}
      {selectedProvider === 'dropbox' && (
        <div className="dropbox-status">
          {authStore.isAuthenticating && (
            <div className="auth-message">
              <span className="spinner-small"></span>
              Signing in...
            </div>
          )}

          {!authStore.isAuthenticated && !authStore.isAuthenticating && (
            <button className="auth-button sign-in" onClick={handleSignIn}>
              Sign in with Dropbox
            </button>
          )}

          {isDropboxAuthenticated && (
            <div className="auth-info">
              <div className="user-info">
                ✓ Signed in as <strong>{authStore.displayName}</strong>
              </div>
              <div className="auth-buttons">
                <button
                  className="auth-button refresh"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Refresh files from Dropbox"
                >
                  🔄 Refresh
                </button>
                <button className="auth-button sign-out" onClick={handleSignOut}>
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {authStore.authError && (
            <div className="auth-error">{authStore.authError}</div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading-indicator">
          <span className="spinner-small"></span>
          Loading files...
        </div>
      )}
    </div>
  )
}
