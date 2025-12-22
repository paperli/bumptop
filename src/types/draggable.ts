/**
 * Unified Draggable Object Types
 * Shared interface for all interactive objects (files, content panels, etc.)
 */

import { RapierRigidBody } from '@react-three/rapier'

/**
 * Type of draggable object
 */
export type DraggableObjectType = 'file' | 'content'

/**
 * Unified interface for draggable objects
 */
export interface DraggableObject {
  id: string
  type: DraggableObjectType
  position: [number, number, number]
}

/**
 * Physics configuration for draggable objects
 */
export interface DraggablePhysicsConfig {
  restitution: number
  friction: number
  linearDamping: number
  angularDamping: number
  lockRotations?: boolean
  gravityScale?: number
  ccd?: boolean
}

/**
 * Gesture configuration for draggable objects
 */
export interface DraggableGestureConfig {
  minThrowSpeed?: number
  maxThrowSpeed?: number
  dragSmoothing?: number
  boundaryMargin?: number
  onDoubleTap?: () => void
}

/**
 * Unified drag state
 */
export interface DragState {
  isDragging: boolean
  draggingObjectId: string | null
  draggingObjectType: DraggableObjectType | null
}

/**
 * Reference tracking for boundary enforcement
 */
export interface DraggableRefs {
  fileRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
  contentRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
}
