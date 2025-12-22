/**
 * useGestures Hook
 * React hook for handling file object gestures (drag, throw, scale)
 */

import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { RapierRigidBody } from '@react-three/rapier'
import { Vector3, Plane, Raycaster } from 'three'
import { GestureInterpreter } from '../input/GestureInterpreter'
import { PointerVelocityTracker } from '../input/PointerVelocityTracker'
import { useFileStore } from '../store/fileStore'

export interface UseGesturesOptions {
  rigidBodyRef: React.RefObject<RapierRigidBody>
  fileId: string // Required to track which file is being dragged
  onDoubleClick?: () => void
  minThrowSpeed?: number
  maxThrowSpeed?: number
  dragSmoothing?: number // 0-1, higher = smoother but more lag (default: 0.3)
}

export function useGestures(options: UseGesturesOptions) {
  const {
    rigidBodyRef,
    fileId,
    onDoubleClick,
    minThrowSpeed = 0.1,
    maxThrowSpeed = 5.0,
    dragSmoothing = 0.3,
  } = options

  const gestureInterpreter = useRef(new GestureInterpreter())
  const velocityTracker = useRef(new PointerVelocityTracker())
  const dragStartPosition = useRef<Vector3 | null>(null)
  const targetPosition = useRef<Vector3 | null>(null) // Target position for smooth interpolation
  const isDraggingStartedRef = useRef(false) // Track if we've started dragging motion
  const setDraggingFile = useFileStore((state) => state.setDraggingFile)
  const draggingFileId = useFileStore((state) => state.draggingFileId)

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Ignore if another file is already being dragged
      if (draggingFileId !== null && draggingFileId !== fileId) {
        console.log(`Pointer down on file ${fileId} ignored - file ${draggingFileId} is being dragged`)
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent
      gestureInterpreter.current.onPointerDown(pointerId, clientX, clientY)

      // Capture the pointer to prevent OrbitControls from seeing events
      // This is more reliable than state-based disabling for the first interaction
      if (event.target && 'setPointerCapture' in event.target) {
        try {
          ;(event.target as any).setPointerCapture(pointerId)
          console.log('Pointer captured - OrbitControls will not see events')
        } catch (e) {
          console.warn('Failed to capture pointer:', e)
        }
      }

      // Also disable OrbitControls via state (backup mechanism)
      setDraggingFile(true, fileId)
      console.log(`[Drag] Pointer down on file ${fileId}`)

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
    [rigidBodyRef, setDraggingFile, draggingFileId, fileId]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this file is the one being dragged
      if (draggingFileId !== null && draggingFileId !== fileId) {
        return
      }

      const { pointerId, clientX, clientY } = event.nativeEvent

      gestureInterpreter.current.onPointerMove(pointerId, clientX, clientY)

      // Always update position and track velocity while pointer is down
      if (rigidBodyRef.current) {
        const currentPos = rigidBodyRef.current.translation()

        // CRITICAL FIX: Raycast to a horizontal plane at the file's current Y height
        // instead of using event.point (which hits the file mesh at varying angles)
        const dragPlane = new Plane(new Vector3(0, 1, 0), -currentPos.y) // Horizontal plane at current Y
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
          // Ray doesn't intersect plane (very rare), skip this frame
          return
        }

        // Check if we've moved enough to start dragging (8px threshold)
        const isDragging = gestureInterpreter.current.isDraggingGesture()

        if (isDragging) {
          // Log when dragging actually starts (once per drag session)
          if (!isDraggingStartedRef.current) {
            console.log(`[Drag] Started dragging file ${fileId} (8px threshold crossed)`)
            isDraggingStartedRef.current = true
          }

          // Update target position (use intersection with drag plane)
          targetPosition.current = new Vector3(intersectionPoint.x, currentPos.y, intersectionPoint.z)

          // Smooth interpolation (lerp) between current and target position
          // lerp factor: 0 = no movement, 1 = instant snap
          const lerpFactor = 1 - dragSmoothing
          const newX = currentPos.x + (targetPosition.current.x - currentPos.x) * lerpFactor
          const newZ = currentPos.z + (targetPosition.current.z - currentPos.z) * lerpFactor

          // Update position
          rigidBodyRef.current.setTranslation(
            { x: newX, y: currentPos.y, z: newZ },
            true
          )

          // CRITICAL: Track velocity of actual object position (after lerp), not pointer
          // Only track XZ plane (horizontal movement), ignore Y
          const objectPos = rigidBodyRef.current.translation()
          const trackingPos = new Vector3(objectPos.x, 0, objectPos.z)
          velocityTracker.current.addSample(trackingPos)

          // Debug: Log position every 10 frames
          if (velocityTracker.current.getSampleCount() % 10 === 0) {
            console.log(
              `[Drag] Pos: [${objectPos.x.toFixed(2)}, ${objectPos.z.toFixed(2)}], ` +
                `Target: [${intersectionPoint.x.toFixed(2)}, ${intersectionPoint.z.toFixed(2)}]`
            )
          }
        }
      }
    },
    [rigidBodyRef, dragSmoothing, draggingFileId, fileId]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      // Only process if this file is the one being dragged
      if (draggingFileId !== null && draggingFileId !== fileId) {
        return
      }

      const { pointerId } = event.nativeEvent
      const wasDragging = gestureInterpreter.current.isDraggingGesture()

      gestureInterpreter.current.onPointerUp(pointerId)

      // Release pointer capture
      if (event.target && 'releasePointerCapture' in event.target) {
        try {
          ;(event.target as any).releasePointerCapture(pointerId)
          console.log('Pointer released')
        } catch (e) {
          // Pointer might already be released, ignore
        }
      }

      // Re-enable OrbitControls if we were dragging
      if (wasDragging) {
        setDraggingFile(false)
        console.log(`[Drag] Ended dragging file ${fileId}`)
      }

      if (rigidBodyRef.current) {
        // Switch back to dynamic mode
        rigidBodyRef.current.setBodyType(0, true) // 0 = dynamic

        // If was dragging, apply throw impulse
        if (wasDragging) {
          const hasEnoughSamples = velocityTracker.current.hasEnoughSamples()
          const sampleCount = velocityTracker.current.getSampleCount()

          console.log(`[Throw] Analyzing throw with ${sampleCount} samples`)

          if (hasEnoughSamples) {
            const velocity = velocityTracker.current.getVelocity()

            // Only use XZ plane for throw (ignore Y component, which should already be 0)
            velocity.y = 0
            const speed = velocity.length()

            // Determine direction description for debugging
            let direction = ''
            if (Math.abs(velocity.x) > Math.abs(velocity.z)) {
              direction = velocity.x > 0 ? '+X (right)' : '-X (left)'
            } else {
              direction = velocity.z > 0 ? '+Z (away from camera)' : '-Z (toward camera)'
            }

            console.log(
              `[Throw] Raw velocity: x=${velocity.x.toFixed(3)}, z=${velocity.z.toFixed(3)}, ` +
                `speed=${speed.toFixed(3)} m/s, direction=${direction}`
            )

            // Only apply impulse if speed is above minimum
            if (speed > minThrowSpeed) {
              // Clamp velocity to max throw speed
              let clampedSpeed = speed
              if (speed > maxThrowSpeed) {
                velocity.normalize().multiplyScalar(maxThrowSpeed)
                clampedSpeed = maxThrowSpeed
                console.log(`[Throw] Speed clamped: ${speed.toFixed(3)} → ${maxThrowSpeed} m/s`)
              }

              // Apply impulse (convert velocity to impulse by multiplying by mass estimate)
              const mass = 0.5 // Estimate mass for file objects
              const impulse = velocity.clone().multiplyScalar(mass)

              rigidBodyRef.current.applyImpulse(
                { x: impulse.x, y: 0, z: impulse.z }, // Ensure Y=0
                true
              )

              console.log(
                `[Throw] ✓ Impulse applied: [${impulse.x.toFixed(3)}, 0, ${impulse.z.toFixed(3)}], ` +
                  `speed=${clampedSpeed.toFixed(3)} m/s`
              )
            } else {
              console.log(`[Throw] ✗ Speed too low: ${speed.toFixed(3)} < ${minThrowSpeed} m/s`)
            }
          } else {
            console.log('[Throw] ✗ Not enough samples (need at least 2)')
          }
        }
        // Single tap without drag -> just log (no selection)
        else if (!wasDragging) {
          console.log('File tapped (no selection on tap)')
        }
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, minThrowSpeed, maxThrowSpeed, setDraggingFile, draggingFileId, fileId]
  )

  const handlePointerCancel = useCallback((event: ThreeEvent<PointerEvent>) => {
    // Only process if this file is the one being dragged
    if (draggingFileId !== null && draggingFileId !== fileId) {
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
    setDraggingFile(false)
    console.log('Drag cancelled - OrbitControls enabled')

    // Switch back to dynamic mode
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setBodyType(0, true)
    }

    velocityTracker.current.clear()
    dragStartPosition.current = null
    targetPosition.current = null
  }, [rigidBodyRef, setDraggingFile, draggingFileId, fileId])

  const handlePointerLeave = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      // Only process if this file is the one being dragged
      if (draggingFileId !== null && draggingFileId !== fileId) {
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
      setDraggingFile(false)
      console.log('Pointer left canvas - OrbitControls enabled, cleaning up')

      // Switch back to dynamic mode
      if (rigidBodyRef.current) {
        rigidBodyRef.current.setBodyType(0, true)
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
      targetPosition.current = null
    },
    [rigidBodyRef, setDraggingFile, draggingFileId, fileId]
  )

  const handleWheel = useCallback(
    (event: ThreeEvent<WheelEvent>) => {
      event.stopPropagation()

      // Wheel for scaling (Phase 3)
      // TODO: Implement scaling in next iteration
      console.log('Wheel event:', event.nativeEvent.deltaY)
    },
    []
  )

  return {
    gestureHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerLeave,
      onWheel: handleWheel,
    },
  }
}
