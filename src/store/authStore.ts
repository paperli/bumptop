/**
 * Authentication State Store
 * Manages OAuth flow state and user information
 */

import { create } from 'zustand'
import { clearAll, hasValidToken, getUserInfo } from '../utils/tokenStorage'

interface AuthState {
  // Authentication status
  isAuthenticated: boolean
  isAuthenticating: boolean

  // User information
  accountId: string | null
  email: string | null
  displayName: string | null

  // OAuth flow temporary state (cleared after token exchange)
  codeVerifier: string | null
  state: string | null

  // Error handling
  authError: string | null

  // Actions
  setAuthenticating: (isAuthenticating: boolean) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setUserInfo: (accountId: string, email: string, displayName: string) => void
  setOAuthState: (codeVerifier: string, state: string) => void
  clearOAuthState: () => void
  setAuthError: (error: string | null) => void
  signOut: () => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  isAuthenticated: false,
  isAuthenticating: false,
  accountId: null,
  email: null,
  displayName: null,
  codeVerifier: null,
  state: null,
  authError: null,

  // Actions
  setAuthenticating: (isAuthenticating) => {
    console.log('[AuthStore] Set authenticating:', isAuthenticating)
    set({ isAuthenticating, authError: null })
  },

  setAuthenticated: (isAuthenticated) => {
    console.log('[AuthStore] Set authenticated:', isAuthenticated)
    set({ isAuthenticated, isAuthenticating: false })
  },

  setUserInfo: (accountId, email, displayName) => {
    console.log('[AuthStore] Set user info:', displayName)
    set({
      accountId,
      email,
      displayName,
      isAuthenticated: true,
      isAuthenticating: false,
      authError: null,
    })
  },

  setOAuthState: (codeVerifier, state) => {
    console.log('[AuthStore] Set OAuth state (verifier and state stored)')
    set({ codeVerifier, state })
  },

  clearOAuthState: () => {
    console.log('[AuthStore] Clear OAuth state')
    set({ codeVerifier: null, state: null })
  },

  setAuthError: (error) => {
    console.log('[AuthStore] Set auth error:', error)
    set({
      authError: error,
      isAuthenticating: false,
    })
  },

  signOut: () => {
    console.log('[AuthStore] Sign out')
    clearAll()
    set({
      isAuthenticated: false,
      isAuthenticating: false,
      accountId: null,
      email: null,
      displayName: null,
      codeVerifier: null,
      state: null,
      authError: null,
    })
  },

  initialize: () => {
    console.log('[AuthStore] Initializing from sessionStorage...')

    // Check if we have a valid token
    if (hasValidToken()) {
      // Restore user info from sessionStorage
      const userInfo = getUserInfo()

      if (userInfo) {
        console.log('[AuthStore] ✓ Restored session for:', userInfo.displayName)
        set({
          isAuthenticated: true,
          accountId: userInfo.accountId,
          email: userInfo.email,
          displayName: userInfo.displayName,
          authError: null,
        })
      } else {
        console.log('[AuthStore] Token found but no user info, clearing token')
        clearAll()
      }
    } else {
      console.log('[AuthStore] No valid token found')
    }
  },
}))
