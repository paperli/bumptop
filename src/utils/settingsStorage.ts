/**
 * Settings Storage Utility
 * Manages app settings with localStorage persistence
 */

export interface AppSettings {
  // Desk boundary settings
  deskWidth: number // meters
  deskHeight: number // meters

  // Physics settings
  gravity: number
  restitution: number // bounciness (0-1)
  friction: number // (0-1)
  linearDamping: number // (0-1)
  angularDamping: number // (0-1)

  // Content object settings
  defaultContentWidth: number // meters
  defaultContentHeight: number // meters

  // UI settings
  showDebugInfo: boolean
  showBoundaryWireframe: boolean

  // Dropbox settings (v1)
  dropboxRootPath: string
}

const STORAGE_KEY = 'bumptop-settings'

const DEFAULT_SETTINGS: AppSettings = {
  // From PRD Appendix A
  deskWidth: 1.2, // meters
  deskHeight: 0.7, // meters

  // Physics defaults
  gravity: -9.81,
  restitution: 0.6,
  friction: 0.5,
  linearDamping: 0.3,
  angularDamping: 0.4,

  // Content object defaults
  defaultContentWidth: 0.45, // meters
  defaultContentHeight: 0.30, // meters

  // UI defaults
  showDebugInfo: false,
  showBoundaryWireframe: false,

  // Dropbox defaults
  dropboxRootPath: '/Desktop',
}

/**
 * Load settings from localStorage
 * Returns default settings if none exist or parsing fails
 */
export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { ...DEFAULT_SETTINGS }
    }

    const parsed = JSON.parse(stored)
    // Merge with defaults to ensure all keys exist (for version compatibility)
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error)
    return { ...DEFAULT_SETTINGS }
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
  }
}

/**
 * Reset settings to defaults
 */
export function resetSettings(): AppSettings {
  const defaults = { ...DEFAULT_SETTINGS }
  saveSettings(defaults)
  return defaults
}

/**
 * Update partial settings
 */
export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings()
  const updated = { ...current, ...partial }
  saveSettings(updated)
  return updated
}

/**
 * Get a single setting value
 */
export function getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
  const settings = loadSettings()
  return settings[key]
}

/**
 * Set a single setting value
 */
export function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): void {
  updateSettings({ [key]: value } as Partial<AppSettings>)
}
