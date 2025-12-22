/**
 * Gesture Interpreter
 * State machine for interpreting pointer gestures (tap, drag, throw, pinch)
 * Based on PRD Appendix B specifications
 */

import { GestureState, GestureConfig, PointerInfo } from '../types'

// Default gesture configuration (from PRD)
const DEFAULT_CONFIG: GestureConfig = {
  tapMaxMs: 220, // Maximum duration for a tap
  doubleTapMaxMs: 300, // Maximum time between taps for double-tap
  dragStartPx: 8, // Minimum movement to start drag
  pinchStartPx: 10, // Minimum distance change to start pinch
  maxScale: 3.0, // Maximum scale multiplier
  minScale: 0.5, // Minimum scale multiplier
}

export class GestureInterpreter {
  private state: GestureState = 'idle'
  private config: GestureConfig
  private pointers: Map<number, PointerInfo> = new Map()
  private pressStartTime = 0
  private pressStartPosition = { x: 0, y: 0 }
  private lastTapTime = 0
  private isDragging = false

  constructor(config?: Partial<GestureConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Get current gesture state
   */
  getState(): GestureState {
    return this.state
  }

  /**
   * Check if currently dragging
   */
  isDraggingGesture(): boolean {
    return this.isDragging
  }

  /**
   * Handle pointer down event
   */
  onPointerDown(pointerId: number, x: number, y: number): void {
    const now = performance.now()

    this.pointers.set(pointerId, {
      id: pointerId,
      x,
      y,
      timestamp: now,
    })

    // Single pointer press
    if (this.pointers.size === 1) {
      this.state = 'pressing'
      this.pressStartTime = now
      this.pressStartPosition = { x, y }
      this.isDragging = false

      console.log('GestureInterpreter: pressing')
    }
    // Two pointers = potential pinch
    else if (this.pointers.size === 2) {
      this.state = 'pinching'
      this.isDragging = false

      console.log('GestureInterpreter: pinching')
    }
  }

  /**
   * Handle pointer move event
   */
  onPointerMove(pointerId: number, x: number, y: number): void {
    const pointer = this.pointers.get(pointerId)
    if (!pointer) return

    // Update pointer position
    pointer.x = x
    pointer.y = y
    pointer.timestamp = performance.now()

    // Check if we should transition to dragging
    if (this.state === 'pressing' && !this.isDragging) {
      const dx = x - this.pressStartPosition.x
      const dy = y - this.pressStartPosition.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > this.config.dragStartPx) {
        this.state = 'dragging'
        this.isDragging = true

        console.log('GestureInterpreter: dragging started')
      }
    }
  }

  /**
   * Handle pointer up event
   */
  onPointerUp(pointerId: number): void {
    const pointer = this.pointers.get(pointerId)
    if (!pointer) return

    const now = performance.now()
    const pressDuration = now - this.pressStartTime

    // Was dragging -> released (potential throw)
    if (this.state === 'dragging') {
      this.state = 'released'
      this.isDragging = false

      console.log('GestureInterpreter: released (throw)')
    }
    // Short press without drag -> tap
    else if (this.state === 'pressing' && pressDuration < this.config.tapMaxMs) {
      // Check for double-tap
      const timeSinceLastTap = now - this.lastTapTime
      if (timeSinceLastTap < this.config.doubleTapMaxMs) {
        console.log('GestureInterpreter: double-tap detected')
        // Reset last tap time to prevent triple-tap
        this.lastTapTime = 0
      } else {
        console.log('GestureInterpreter: single tap')
        this.lastTapTime = now
      }

      this.state = 'idle'
      this.isDragging = false
    }
    // Pinching ended
    else if (this.state === 'pinching') {
      // If all pointers released, go idle
      if (this.pointers.size === 1) {
        this.state = 'idle'
      }
    }
    // Long press without drag
    else {
      this.state = 'idle'
      this.isDragging = false
    }

    this.pointers.delete(pointerId)

    // Return to idle if no pointers left
    if (this.pointers.size === 0) {
      this.state = 'idle'
      this.isDragging = false
    }
  }

  /**
   * Handle pointer cancel event
   */
  onPointerCancel(pointerId: number): void {
    this.pointers.delete(pointerId)

    if (this.pointers.size === 0) {
      this.state = 'idle'
      this.isDragging = false
    }
  }

  /**
   * Get distance between two pointers (for pinch gesture)
   */
  getPinchDistance(): number | null {
    if (this.pointers.size !== 2) return null

    const [p1, p2] = Array.from(this.pointers.values())
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get center point between all pointers
   */
  getCenterPoint(): { x: number; y: number } | null {
    if (this.pointers.size === 0) return null

    let sumX = 0
    let sumY = 0

    this.pointers.forEach((pointer) => {
      sumX += pointer.x
      sumY += pointer.y
    })

    return {
      x: sumX / this.pointers.size,
      y: sumY / this.pointers.size,
    }
  }

  /**
   * Reset gesture interpreter state
   */
  reset(): void {
    this.state = 'idle'
    this.pointers.clear()
    this.isDragging = false
    this.pressStartTime = 0
    this.lastTapTime = 0
  }
}
