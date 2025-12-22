/**
 * useContentGestures Hook
 * React hook for handling content object gestures (drag, throw, scale)
 * Similar to useGestures but adapted for content preview panels
 */

import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { RapierRigidBody } from '@react-three/rapier'
import { Vector3, Plane, Raycaster } from 'three'
import { GestureInterpreter } from '../input/GestureInterpreter'
import { PointerVelocityTracker } from '../input/PointerVelocityTracker'
import { useContentStore } from '../store/contentStore'
import { useAppStore } from '../store/appStore'

export interface UseContentGesturesOptions {
  rigidBodyRef: React.RefObject<RapierRigidBody>
  contentId: string // Required to track which content is being dragged
  minThrowSpeed?: number
  maxThrowSpeed?: number
  dragSmoothing?: number // 0-1, higher = smoother but more lag (default: 0.2)
}

export function useContentGestures(options: UseContentGesturesOptions) {
  const {
    rigidBodyRef,
    contentId,
    minThrowSpeed = 0.1,
    maxThrowSpeed = 5.0,
    dragSmoothing = 0.2,
  } = options

  const gestureInterpreter = useRef(new GestureInterpreter())
  const velocityTracker = useRef(new PointerVelocityTracker())
  const dragStartPosition = useRef<Vector3 | null>(null)
  const targetPosition = useRef<Vector3 | null>(null) // Target position for smooth interpolation
  const isDraggingStartedRef = useRef(false) // Track if we've started dragging motion
  const setDraggingContent = useContentStore((state) => state.setDraggingContent)
  const draggingContentId = useContentStore((state) => state.draggingContentId)
  const settings = useAppStore((state) => state.settings)

  // Helper function to clamp position within desk boundaries
  const clampToBoundary = useCallback(
    (x: number, z: number, margin = 0.1): { x: number; z: number } => {
      const halfWidth = settings.deskWidth / 2 - margin
      const halfHeight = settings.deskHeight / 2 - margin

      return {
        x: Math.max(-halfWidth, Math.min(halfWidth, x)),
        z: Math.max(-halfHeight, Math.min(halfHeight, z)),
      }
    },
    [settings.deskWidth, settings.deskHeight]
  )

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Ignore if another content is already being dragged
      if (draggingContentId !== null && draggingContentId !== contentId) {
        console.log(`Pointer down on content ${contentId} ignored - content ${draggingContentId} is being dragged`)
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent
      gestureInterpreter.current.onPointerDown(pointerId, clientX, clientY)

      // Capture the pointer to prevent OrbitControls from seeing events
      if (event.target && 'setPointerCapture' in event.target) {
        try {
          ;(event.target as any).setPointerCapture(pointerId)
          console.log('[Content] Pointer captured - OrbitControls will not see events')
        } catch (e) {
          console.warn('[Content] Failed to capture pointer:', e)
        }
      }

      // Disable OrbitControls via state
      setDraggingContent(true, contentId)
      console.log(`[Content] Pointer down on content ${contentId}`)

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
    [rigidBodyRef, setDraggingContent, draggingContentId, contentId]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this content is the one being dragged
      if (draggingContentId !== null && draggingContentId !== contentId) {
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent

      gestureInterpreter.current.onPointerMove(pointerId, clientX, clientY)

      // Always update position and track velocity while pointer is down
      if (rigidBodyRef.current) {
        const currentPos = rigidBodyRef.current.translation()

        // Raycast to a horizontal plane at the content's current Y height
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
            console.log(`[Content] Started dragging content ${contentId}`)
            isDraggingStartedRef.current = true
          }

          // Update target position (use intersection with drag plane)
          targetPosition.current = new Vector3(intersectionPoint.x, currentPos.y, intersectionPoint.z)

          // Smooth interpolation (lerp) between current and target position
          const lerpFactor = 1 - dragSmoothing
          let newX = currentPos.x + (targetPosition.current.x - currentPos.x) * lerpFactor
          let newZ = currentPos.z + (targetPosition.current.z - currentPos.z) * lerpFactor

          // Clamp position to stay within desk boundaries
          // Use larger margin (0.1m) to ensure full panel stays visible
          const clamped = clampToBoundary(newX, newZ, 0.1)
          newX = clamped.x
          newZ = clamped.z

          // Update position
          rigidBodyRef.current.setTranslation(
            { x: newX, y: currentPos.y, z: newZ },
            true
          )

          // Track velocity of actual object position (after lerp)
          const objectPos = rigidBodyRef.current.translation()
          const trackingPos = new Vector3(objectPos.x, 0, objectPos.z)
          velocityTracker.current.addSample(trackingPos)
        }
      }
    },
    [rigidBodyRef, dragSmoothing, draggingContentId, contentId, clampToBoundary]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Only process if this content is the one being dragged
      if (draggingContentId !== null && draggingContentId !== contentId) {
        return
      }

      const { pointerId } = event.nativeEvent
      const wasDragging = gestureInterpreter.current.isDraggingGesture()

      gestureInterpreter.current.onPointerUp(pointerId)

      // Release pointer capture
      if (event.target && 'releasePointerCapture' in event.target) {
        try {
          ;(event.target as any).releasePointerCapture(pointerId)
          console.log('[Content] Pointer released')
        } catch (e) {
          // Pointer might already be released, ignore
        }
      }

      // Re-enable OrbitControls
      if (wasDragging) {
        setDraggingContent(false)
        console.log(`[Content] Ended dragging content ${contentId}`)
      }

      if (rigidBodyRef.current) {
        // Switch back to dynamic mode
        rigidBodyRef.current.setBodyType(0, true) // 0 = dynamic

        // If was dragging, apply throw impulse
        if (wasDragging) {
          const hasEnoughSamples = velocityTracker.current.hasEnoughSamples()
          const sampleCount = velocityTracker.current.getSampleCount()

          console.log(`[Content Throw] Analyzing throw with ${sampleCount} samples`)

          if (hasEnoughSamples) {
            const velocity = velocityTracker.current.getVelocity()

            // Only use XZ plane for throw (ignore Y component)
            velocity.y = 0
            const speed = velocity.length()

            console.log(
              `[Content Throw] Raw velocity: x=${velocity.x.toFixed(3)}, z=${velocity.z.toFixed(3)}, ` +
                `speed=${speed.toFixed(3)} m/s`
            )

            // Only apply impulse if speed is above minimum
            if (speed > minThrowSpeed) {
              // Clamp velocity to max throw speed
              if (speed > maxThrowSpeed) {
                velocity.normalize().multiplyScalar(maxThrowSpeed)
                console.log(`[Content Throw] Speed clamped: ${speed.toFixed(3)} → ${maxThrowSpeed} m/s`)
              }

              // Apply impulse (convert velocity to impulse by multiplying by mass estimate)
              const mass = 0.8
              const impulse = velocity.clone().multiplyScalar(mass)

              rigidBodyRef.current.applyImpulse(
                { x: impulse.x, y: 0, z: impulse.z },
                true
              )

              console.log(
                `[Content Throw] ✓ Impulse applied: [${impulse.x.toFixed(3)}, 0, ${impulse.z.toFixed(3)}]`
              )
            } else {
              console.log(`[Content Throw] ✗ Speed too low: ${speed.toFixed(3)} < ${minThrowSpeed} m/s`)
            }
          } else {
            console.log('[Content Throw] ✗ Not enough samples')
          }
        }
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, minThrowSpeed, maxThrowSpeed, setDraggingContent, draggingContentId, contentId]
  )

  const handlePointerCancel = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this content is the one being dragged
      if (draggingContentId !== null && draggingContentId !== contentId) {
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
      setDraggingContent(false)
      console.log('[Content] Drag cancelled - OrbitControls enabled')

      // Switch back to dynamic mode
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setBodyType(0, true)
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, setDraggingContent, draggingContentId, contentId]
  )

  const handlePointerLeave = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this content is the one being dragged
      if (draggingContentId !== null && draggingContentId !== contentId) {
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
      setDraggingContent(false)
      console.log('[Content] Pointer left canvas - OrbitControls enabled, cleaning up')

      // Switch back to dynamic mode
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setBodyType(0, true)
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, setDraggingContent, draggingContentId, contentId]
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
