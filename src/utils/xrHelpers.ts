/**
 * WebXR Helper Utilities
 * Detection and utility functions for WebXR features
 */

import { ModeCapabilities } from '../types'

/**
 * Detect WebXR capabilities
 * Checks for navigator.xr and immersive-ar support
 */
export async function detectXRCapabilities(): Promise<ModeCapabilities> {
  const capabilities: ModeCapabilities = {
    supportsWebXR: false,
    supportsImmersiveAR: false,
  }

  // Check if WebXR is available
  if (!navigator.xr) {
    console.log('WebXR not available (navigator.xr is undefined)')
    return capabilities
  }

  capabilities.supportsWebXR = true
  console.log('WebXR API detected')

  // Check for immersive-ar support
  try {
    const isARSupported = await navigator.xr.isSessionSupported('immersive-ar')
    capabilities.supportsImmersiveAR = isARSupported
    console.log('Immersive AR supported:', isARSupported)
  } catch (error) {
    console.warn('Error checking immersive-ar support:', error)
    capabilities.supportsImmersiveAR = false
  }

  return capabilities
}

/**
 * Check if running in a secure context (required for WebXR)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext
}

/**
 * Get user-friendly browser/device info for debugging
 */
export function getDeviceInfo(): string {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) {
    return 'Android'
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'iOS'
  } else if (/Mac/i.test(ua)) {
    return 'macOS'
  } else if (/Win/i.test(ua)) {
    return 'Windows'
  } else if (/Linux/i.test(ua)) {
    return 'Linux'
  }
  return 'Unknown'
}

/**
 * Log system capabilities for debugging
 */
export function logSystemInfo(): void {
  console.log('=== BumpTop System Info ===')
  console.log('Device:', getDeviceInfo())
  console.log('User Agent:', navigator.userAgent)
  console.log('Secure Context:', isSecureContext())
  console.log('WebXR Available:', !!navigator.xr)
  console.log('===========================')
}
