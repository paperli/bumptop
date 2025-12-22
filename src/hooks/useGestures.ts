/**
 * useGestures Hook
 * React hook for handling file object gestures (drag, throw, scale)
 */

import { useRef, useCallback } from 'react'
import { ThreeEvent } from '@react-three/fiber'
import { RapierRigidBody } from '@react-three/rapier'
import { Vector3 } from 'three'
import { GestureInterpreter } from '../input/GestureInterpreter'
import { PointerVelocityTracker } from '../input/PointerVelocityTracker'
import { useFileStore } from '../store/fileStore'

export interface UseGesturesOptions {
  rigidBodyRef: React.RefObject<RapierRigidBody>
  onDoubleClick?: () => void
  minThrowSpeed?: number
  maxThrowSpeed?: number
}

export function useGestures(options: UseGesturesOptions) {
  const {
    rigidBodyRef,
    onDoubleClick,
    minThrowSpeed = 0.1,
    maxThrowSpeed = 5.0,
  } = options

  const gestureInterpreter = useRef(new GestureInterpreter())
  const velocityTracker = useRef(new PointerVelocityTracker())
  const dragStartPosition = useRef<Vector3 | null>(null)
  const setDraggingFile = useFileStore((state) => state.setDraggingFile)

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

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
      setDraggingFile(true)
      console.log('Pointer down - OrbitControls disabled')

      // Store starting position for drag
      if (rigidBodyRef.current) {
        const pos = rigidBodyRef.current.translation()
        dragStartPosition.current = new Vector3(pos.x, pos.y, pos.z)

        // Switch to kinematic mode for dragging
        rigidBodyRef.current.setBodyType(1, true) // 1 = kinematic
      }

      velocityTracker.current.clear()
    },
    [rigidBodyRef, setDraggingFile]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const { pointerId, clientX, clientY } = event.nativeEvent

      gestureInterpreter.current.onPointerMove(pointerId, clientX, clientY)

      // Always update position and track velocity while pointer is down
      if (rigidBodyRef.current) {
        // Get world position from pointer
        const worldPos = event.point

        // Track velocity for throw detection
        velocityTracker.current.addSample(worldPos)

        // Check if we've moved enough to start dragging (8px threshold)
        const isDragging = gestureInterpreter.current.isDraggingGesture()

        if (isDragging) {
          // Move object to pointer position (keep Y axis)
          const currentPos = rigidBodyRef.current.translation()
          rigidBodyRef.current.setTranslation(
            { x: worldPos.x, y: currentPos.y, z: worldPos.z },
            true
          )
        }
      }
    },
    [rigidBodyRef]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

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
        console.log('Drag ended - OrbitControls enabled')
      }

      if (rigidBodyRef.current) {
        // Switch back to dynamic mode
        rigidBodyRef.current.setBodyType(0, true) // 0 = dynamic

        // If was dragging, apply throw impulse
        if (wasDragging) {
          const hasEnoughSamples = velocityTracker.current.hasEnoughSamples()
          console.log(`Drag ended - has enough samples: ${hasEnoughSamples}`)

          if (hasEnoughSamples) {
            const velocity = velocityTracker.current.getVelocity()
            const speed = velocity.length()

            console.log(`Velocity: x=${velocity.x.toFixed(2)}, y=${velocity.y.toFixed(2)}, z=${velocity.z.toFixed(2)}, speed=${speed.toFixed(2)} m/s`)

            // Only apply impulse if speed is above minimum
            if (speed > minThrowSpeed) {
              // Clamp velocity to max throw speed
              if (speed > maxThrowSpeed) {
                velocity.normalize().multiplyScalar(maxThrowSpeed)
                console.log(`Velocity clamped to max: ${maxThrowSpeed} m/s`)
              }

              // Apply impulse (convert velocity to impulse by multiplying by mass estimate)
              const mass = 0.5 // Estimate mass for file objects
              const impulse = velocity.multiplyScalar(mass)

              rigidBodyRef.current.applyImpulse(
                { x: impulse.x, y: impulse.y, z: impulse.z },
                true
              )

              console.log(`✓ Throw impulse applied: speed=${speed.toFixed(2)} m/s, impulse=[${impulse.x.toFixed(2)}, ${impulse.y.toFixed(2)}, ${impulse.z.toFixed(2)}]`)
            } else {
              console.log(`Speed too low (${speed.toFixed(2)} < ${minThrowSpeed}), no throw`)
            }
          } else {
            console.log('Not enough velocity samples for throw')
          }
        }
        // Single tap without drag -> just log (no selection)
        else if (!wasDragging) {
          console.log('File tapped (no selection on tap)')
        }
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
    },
    [rigidBodyRef, minThrowSpeed, maxThrowSpeed, setDraggingFile]
  )

  const handlePointerCancel = useCallback((event: ThreeEvent<PointerEvent>) => {
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
  }, [rigidBodyRef, setDraggingFile])

  const handlePointerLeave = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
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
    },
    [rigidBodyRef, setDraggingFile]
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
