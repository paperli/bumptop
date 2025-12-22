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
  onSelect?: () => void
  onDeselect?: () => void
  onDoubleClick?: () => void
  minThrowSpeed?: number
  maxThrowSpeed?: number
}

export function useGestures(options: UseGesturesOptions) {
  const {
    rigidBodyRef,
    onSelect,
    onDeselect,
    onDoubleClick,
    minThrowSpeed = 0.1,
    maxThrowSpeed = 5.0,
  } = options

  const gestureInterpreter = useRef(new GestureInterpreter())
  const velocityTracker = useRef(new PointerVelocityTracker())
  const dragStartPosition = useRef<Vector3 | null>(null)
  const lastTapWasSelect = useRef(false)
  const setDraggingFile = useFileStore((state) => state.setDraggingFile)

  const handlePointerDown = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      const { pointerId, clientX, clientY } = event.nativeEvent
      gestureInterpreter.current.onPointerDown(pointerId, clientX, clientY)

      // Store starting position for drag
      if (rigidBodyRef.current) {
        const pos = rigidBodyRef.current.translation()
        dragStartPosition.current = new Vector3(pos.x, pos.y, pos.z)

        // Switch to kinematic mode for dragging
        rigidBodyRef.current.setBodyType(1, true) // 1 = kinematic
      }

      velocityTracker.current.clear()
    },
    [rigidBodyRef]
  )

  const handlePointerMove = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      const { pointerId, clientX, clientY } = event.nativeEvent
      const wasDragging = gestureInterpreter.current.isDraggingGesture()

      gestureInterpreter.current.onPointerMove(pointerId, clientX, clientY)

      // Check if dragging just started
      const isDragging = gestureInterpreter.current.isDraggingGesture()
      if (!wasDragging && isDragging) {
        setDraggingFile(true)
        console.log('Drag started - OrbitControls disabled')
      }

      // If dragging, update position
      if (isDragging && rigidBodyRef.current) {
        // Get world position from pointer
        const worldPos = event.point

        // Track velocity
        velocityTracker.current.addSample(worldPos)

        // Move object to pointer position (keep Y axis)
        const currentPos = rigidBodyRef.current.translation()
        rigidBodyRef.current.setTranslation(
          { x: worldPos.x, y: currentPos.y, z: worldPos.z },
          true
        )
      }
    },
    [rigidBodyRef, setDraggingFile]
  )

  const handlePointerUp = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()

      const { pointerId } = event.nativeEvent
      const wasDragging = gestureInterpreter.current.isDraggingGesture()

      gestureInterpreter.current.onPointerUp(pointerId)

      // Re-enable OrbitControls if we were dragging
      if (wasDragging) {
        setDraggingFile(false)
        console.log('Drag ended - OrbitControls enabled')
      }

      if (rigidBodyRef.current) {
        // Switch back to dynamic mode
        rigidBodyRef.current.setBodyType(0, true) // 0 = dynamic

        // If was dragging, apply throw impulse
        if (wasDragging && velocityTracker.current.hasEnoughSamples()) {
          const velocity = velocityTracker.current.getVelocity()
          const speed = velocity.length()

          // Only apply impulse if speed is above minimum
          if (speed > minThrowSpeed) {
            // Clamp velocity to max throw speed
            if (speed > maxThrowSpeed) {
              velocity.normalize().multiplyScalar(maxThrowSpeed)
            }

            // Apply impulse (convert velocity to impulse by multiplying by mass estimate)
            const mass = 0.5 // Estimate mass for file objects
            const impulse = velocity.multiplyScalar(mass)

            rigidBodyRef.current.applyImpulse(
              { x: impulse.x, y: impulse.y, z: impulse.z },
              true
            )

            console.log(`Throw impulse applied: speed=${speed.toFixed(2)} m/s`)
          }
        }
        // Single tap without drag -> toggle selection
        else if (!wasDragging) {
          if (lastTapWasSelect.current) {
            onDeselect?.()
            lastTapWasSelect.current = false
          } else {
            onSelect?.()
            lastTapWasSelect.current = true
          }
        }
      }

      velocityTracker.current.clear()
      dragStartPosition.current = null
    },
    [rigidBodyRef, onSelect, onDeselect, minThrowSpeed, maxThrowSpeed, setDraggingFile]
  )

  const handlePointerCancel = useCallback((event: ThreeEvent<PointerEvent>) => {
    const { pointerId } = event.nativeEvent
    gestureInterpreter.current.onPointerCancel(pointerId)

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
      onWheel: handleWheel,
    },
  }
}
