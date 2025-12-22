/**
 * Global App State Store (Zustand)
 * Manages app mode, capabilities, and UI state
 */

import { create } from 'zustand'
import { AppMode, ModeCapabilities } from '../types'
import { loadSettings, saveSettings, AppSettings } from '../utils/settingsStorage'

interface AppState {
  // Mode and capabilities
  mode: AppMode
  capabilities: ModeCapabilities
  isARSessionActive: boolean

  // Settings
  settings: AppSettings

  // UI state
  showSettings: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setMode: (mode: AppMode) => void
  setCapabilities: (capabilities: ModeCapabilities) => void
  setARSessionActive: (active: boolean) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  toggleSettings: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  mode: 'simulated',
  capabilities: {
    supportsWebXR: false,
    supportsImmersiveAR: false,
  },
  isARSessionActive: false,
  settings: loadSettings(),
  showSettings: false,
  isLoading: false,
  error: null,

  // Actions
  setMode: (mode) => set({ mode }),

  setCapabilities: (capabilities) => set({ capabilities }),

  setARSessionActive: (active) => set({ isARSessionActive: active }),

  updateSettings: (partial) =>
    set((state) => {
      const updated = { ...state.settings, ...partial }
      saveSettings(updated)
      return { settings: updated }
    }),

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}))
