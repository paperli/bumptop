/**
 * Core type definitions for BumpTop
 */

// ============================================================================
// App Mode
// ============================================================================

export type AppMode = 'ar' | 'simulated'

export interface ModeCapabilities {
  supportsWebXR: boolean
  supportsImmersiveAR: boolean
}

// ============================================================================
// File System
// ============================================================================

export type FileKind = 'image' | 'video' | 'audio' | 'text' | 'unknown'

export interface FileEntry {
  id: string
  name: string
  kind: FileKind
  sizeBytes?: number
  modifiedAt?: string // ISO date string
  mimeType?: string
  path?: string
  thumbnailUrl?: string
}

export interface FileContentHandle {
  url: string // blob: URL or remote URL
  mimeType?: string
}

export interface FileSystemProvider {
  id: string
  label: string

  isAuthenticated(): boolean
  signIn(): Promise<void>
  signOut(): Promise<void>

  // MVP: list fixed folder only
  listFixedFolder(): Promise<FileEntry[]>

  // Fetch content for preview
  getFileContent(entry: FileEntry): Promise<FileContentHandle>
}

// ============================================================================
// 3D Scene
// ============================================================================

export interface DeskBoundary {
  width: number // meters
  height: number // meters
}

export interface ContentObject {
  id: string
  fileEntry: FileEntry
  position: [number, number, number]
  scale: number
  contentUrl?: string // Loaded content URL
  isLoading: boolean
}

export interface PhysicsConfig {
  gravity: number
  restitution: number
  friction: number
  linearDamping: number
  angularDamping: number
}

// ============================================================================
// Gestures
// ============================================================================

export type GestureState = 'idle' | 'pressing' | 'dragging' | 'pinching' | 'released'

export interface GestureConfig {
  tapMaxMs: number
  doubleTapMaxMs: number
  dragStartPx: number
  pinchStartPx: number
  maxScale: number
  minScale: number
}

export interface PointerInfo {
  id: number
  x: number
  y: number
  timestamp: number
}

// ============================================================================
// WebXR
// ============================================================================
// WebXR types are provided by the browser and @react-three/xr
// No need to declare them here to avoid duplicate identifiers
