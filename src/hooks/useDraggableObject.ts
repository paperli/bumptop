/**
 * useDraggableObject Hook
 * Unified React hook for handling all draggable object gestures (drag, throw, scale)
 * Works for files, content panels, and any future draggable objects
 */

import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { RapierRigidBody } from '@react-three/rapier'
import { Vector3, Plane, Raycaster } from 'three'
import { GestureInterpreter } from '../input/GestureInterpreter'
import { PointerVelocityTracker } from '../input/PointerVelocityTracker'
import { useDraggableStore } from '../store/draggableStore'
import { useAppStore } from '../store/appStore'
import { DraggableObjectType, DraggableGestureConfig } from '../types/draggable'

export interface UseDraggableObjectOptions {
  rigidBodyRef: React.RefObject<RapierRigidBody>
  objectId: string
  objectType: DraggableObjectType
  config?: DraggableGestureConfig
}

const DEFAULT_CONFIG: Required<DraggableGestureConfig> = {
  minThrowSpeed: 0.1,
  maxThrowSpeed: 5.0,
  dragSmoothing: 0.2,
  boundaryMargin: 0.05,
  onDoubleTap: () => {},
}

export function useDraggableObject(options: UseDraggableObjectOptions) {
  const { rigidBodyRef, objectId, objectType, config: userConfig } = options

  const config = { ...DEFAULT_CONFIG, ...userConfig }

  const gestureInterpreter = useRef(
    new GestureInterpreter(undefined, {
      onDoubleTap: () => {
        if (config.onDoubleTap) {
          console.log(`[Draggable] Double-tap detected on ${objectType} ${objectId}`)
          config.onDoubleTap()
        }
      },
    })
  )
  const velocityTracker = useRef(new PointerVelocityTracker())
  const dragStartPosition = useRef<Vector3 | null>(null)
  const targetPosition = useRef<Vector3 | null>(null)
  const isDraggingStartedRef = useRef(false)

  const setDragging = useDraggableStore((state) => state.setDragging)
  const draggingObjectId = useDraggableStore((state) => state.draggingObjectId)
  const settings = useAppStore((state) => state.settings)

  // Helper function to clamp position within desk boundaries
  const clampToBoundary = useCallback(
    (x: number, z: number): { x: number; z: number } => {
      const halfWidth = settings.deskWidth / 2 - config.boundaryMargin
      const halfHeight = settings.deskHeight / 2 - config.boundaryMargin

      return {
        x: Math.max(-halfWidth, Math.min(halfWidth, x)),
        z: Math.max(-halfHeight, Math.min(halfHeight, z)),
      }
    },
    [settings.deskWidth, settings.deskHeight, config.boundaryMargin]
  )

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Ignore if another object is already being dragged
      if (draggingObjectId !== null && draggingObjectId !== objectId) {
        console.log(
          `Pointer down on ${objectType} ${objectId} ignored - ` +
            `object ${draggingObjectId} is being dragged`
        )
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent
      gestureInterpreter.current.onPointerDown(pointerId, clientX, clientY)

      // Capture the pointer to prevent OrbitControls from seeing events
      if (event.target && 'setPointerCapture' in event.target) {
        try {
          ;(event.target as any).setPointerCapture(pointerId)
          console.log(`[Draggable] Pointer captured for ${objectType} ${objectId}`)
        } catch (e) {
          console.warn(`[Draggable] Failed to capture pointer:`, e)
        }
      }

      // Disable OrbitControls via unified drag state
      setDragging(true, objectId, objectType)
      console.log(`[Draggable] Pointer down on ${objectType} ${objectId}`)

      // Store starting position for drag
      if (rigidBodyRef.current) {
        const pos = rigidBodyRef.current.translation()
        dragStartPosition.current = new Vector3(pos.x, pos.y, pos.z)

        // Switch to kinematic mode for dragging
        rigidBodyRef.current.setBodyType(1, true) // 1 = kinematic
      }

      // Clear velocity tracker to start fresh
      velocityTracker.current.clear()
      isDraggingStartedRef.current = false
    },
    [rigidBodyRef, setDragging, draggingObjectId, objectId, objectType]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this object is the one being dragged
      if (draggingObjectId !== null && draggingObjectId !== objectId) {
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent

      gestureInterpreter.current.onPointerMove(pointerId, clientX, clientY)

      // Always update position and track velocity while pointer is down
      if (rigidBodyRef.current) {
        const currentPos = rigidBodyRef.current.translation()

        // Raycast to a horizontal plane at the object's current Y height
        const dragPlane = new Plane(new Vector3(0, 1, 0), -currentPos.y)
        const raycaster = new Raycaster()
        raycaster.setFromCamera(
          {
            x: (event.nativeEvent.clientX / window.innerWidth) * 2 - 1,
            y: -(event.nativeEvent.clientY / window.innerHeight) * 2 + 1,
          },
          event.camera
        )

        const intersectionPoint = new Vector3()
        const didIntersect = raycaster.ray.intersectPlane(dragPlane, intersectionPoint)

        if (!didIntersect) {
          return
        }

        // Check if we've moved enough to start dragging (8px threshold)
        const isDragging = gestureInterpreter.current.isDraggingGesture()

        if (isDragging) {
          // Log when dragging actually starts (once per drag session)
          if (!isDraggingStartedRef.current) {
            console.log(`[Draggable] Started dragging ${objectType} ${objectId}`)
            isDraggingStartedRef.current = true
          }

          // Update target position (use intersection with drag plane)
          targetPosition.current = new Vector3(intersectionPoint.x, currentPos.y, intersectionPoint.z)

          // Smooth interpolation (lerp) between current and target position
          const lerpFactor = 1 - config.dragSmoothing
          let newX = currentPos.x + (targetPosition.current.x - currentPos.x) * lerpFactor
          let newZ = currentPos.z + (targetPosition.current.z - currentPos.z) * lerpFactor

          // Clamp position to stay within desk boundaries
          const clamped = clampToBoundary(newX, newZ)
          const wasClamped = clamped.x !== newX || clamped.z !== newZ
          newX = clamped.x
          newZ = clamped.z

          if (wasClamped) {
            console.log(
              `[Draggable] ${objectType} ${objectId} position clamped to boundary: ` +
                `[${newX.toFixed(2)}, ${newZ.toFixed(2)}]`
            )
          }

          // Update position
          rigidBodyRef.current.setTranslation({ x: newX, y: currentPos.y, z: newZ }, true)

          // Track velocity of actual object position (after lerp)
          const objectPos = rigidBodyRef.current.translation()
          const trackingPos = new Vector3(objectPos.x, 0, objectPos.z)
          velocityTracker.current.addSample(trackingPos)
        }
      }
    },
    [rigidBodyRef, config.dragSmoothing, draggingObjectId, objectId, objectType, clampToBoundary]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Only process if this object is the one being dragged
      if (draggingObjectId !== null && draggingObjectId !== objectId) {
        return
      }

      const { pointerId } = event.nativeEvent
      const wasDragging = gestureInterpreter.current.isDraggingGesture()

      gestureInterpreter.current.onPointerUp(pointerId)

      // Release pointer capture
      if (event.target && 'releasePointerCapture' in event.target) {
        try {
          ;(event.target as any).releasePointerCapture(pointerId)
          console.log(`[Draggable] Pointer released for ${objectType} ${objectId}`)
        } catch (e) {
          // Pointer might already be released, ignore
        }
      }

      // Re-enable OrbitControls
      if (wasDragging) {
        setDragging(false)
        console.log(`[Draggable] Ended dragging ${objectType} ${objectId}`)
      }

      if (rigidBodyRef.current) {
        // Switch back to dynamic mode
        rigidBodyRef.current.setBodyType(0, true) // 0 = dynamic

        // If was dragging, apply throw impulse
        if (wasDragging) {
          const hasEnoughSamples = velocityTracker.current.hasEnoughSamples()
          const sampleCount = velocityTracker.current.getSampleCount()

          console.log(`[Draggable] Analyzing throw for ${objectType} ${objectId} with ${sampleCount} samples`)

          if (hasEnoughSamples) {
            const velocity = velocityTracker.current.getVelocity()

            // Only use XZ plane for throw (ignore Y component)
            velocity.y = 0
            const speed = velocity.length()

            console.log(
              `[Draggable] Raw velocity: x=${velocity.x.toFixed(3)}, z=${velocity.z.toFixed(3)}, ` +
                `speed=${speed.toFixed(3)} m/s`
            )

            // Only apply impulse if speed is above minimum
            if (speed > config.minThrowSpeed) {
              // Clamp velocity to max throw speed
              if (speed > config.maxThrowSpeed) {
                velocity.normalize().multiplyScalar(config.maxThrowSpeed)
                console.log(`[Draggable] Speed clamped: ${speed.toFixed(3)} → ${config.maxThrowSpeed} m/s`)
              }

              // Apply impulse (convert velocity to impulse by multiplying by mass estimate)
              const mass = 0.8
              const impulse = velocity.clone().multiplyScalar(mass)

              rigidBodyRef.current.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true)

              console.log(
                `[Draggable] ✓ Impulse applied to ${objectType} ${objectId}: ` +
                  `[${impulse.x.toFixed(3)}, 0, ${impulse.z.toFixed(3)}]`
              )
            } else {
              console.log(
                `[Draggable] ✗ Speed too low for ${objectType} ${objectId}: ` +
                  `${speed.toFixed(3)} < ${config.minThrowSpeed} m/s`
              )
            }
          } else {
            console.log(`[Draggable] ✗ Not enough samples for ${objectType} ${objectId}`)
          }
        }
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, config.minThrowSpeed, config.maxThrowSpeed, setDragging, draggingObjectId, objectId, objectType]
  )

  const handlePointerCancel = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this object is the one being dragged
      if (draggingObjectId !== null && draggingObjectId !== objectId) {
        return
      }

      const { pointerId } = event.nativeEvent
      gestureInterpreter.current.onPointerCancel(pointerId)

      // Release pointer capture
      if (event.target && 'releasePointerCapture' in event.target) {
        try {
          ;(event.target as any).releasePointerCapture(pointerId)
        } catch (e) {
          // Ignore if already released
        }
      }

      // Re-enable OrbitControls
      setDragging(false)
      console.log(`[Draggable] Drag cancelled for ${objectType} ${objectId}`)

      // Switch back to dynamic mode
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setBodyType(0, true)
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, setDragging, draggingObjectId, objectId, objectType]
  )

  const handlePointerLeave = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this object is the one being dragged
      if (draggingObjectId !== null && draggingObjectId !== objectId) {
        return
      }

      const { pointerId } = event.nativeEvent

      // Treat pointer leaving as a cancel event
      gestureInterpreter.current.onPointerCancel(pointerId)

      // Release pointer capture
      if (event.target && 'releasePointerCapture' in event.target) {
        try {
          ;(event.target as any).releasePointerCapture(pointerId)
        } catch (e) {
          // Ignore if already released
        }
      }

      // Re-enable OrbitControls
      setDragging(false)
      console.log(`[Draggable] Pointer left canvas for ${objectType} ${objectId}`)

      // Switch back to dynamic mode
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setBodyType(0, true)
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, setDragging, draggingObjectId, objectId, objectType]
  )

  return {
    gestureHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerLeave,
    },
  }
}
