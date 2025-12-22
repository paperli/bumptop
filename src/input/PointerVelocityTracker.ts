/**
 * Pointer Velocity Tracker
 * Tracks pointer positions over time to calculate velocity for throwing
 */

import { Vector3 } from 'three'

interface PointerSample {
  position: Vector3
  timestamp: number
}

export class PointerVelocityTracker {
  private samples: PointerSample[] = []
  private maxSamples = 5 // Keep last 5 samples for velocity calculation
  private maxAge = 100 // Only consider samples from last 100ms

  /**
   * Add a new pointer position sample
   */
  addSample(position: Vector3): void {
    const now = performance.now()

    this.samples.push({
      position: position.clone(),
      timestamp: now,
    })

    // Keep only recent samples
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }
  }

  /**
   * Calculate velocity vector based on recent samples
   * Returns velocity in units per second
   */
  getVelocity(): Vector3 {
    const now = performance.now()

    // Filter samples within maxAge
    const recentSamples = this.samples.filter(
      (sample) => now - sample.timestamp < this.maxAge
    )

    if (recentSamples.length < 2) {
      return new Vector3(0, 0, 0)
    }

    // Use first and last sample for velocity calculation
    const first = recentSamples[0]
    const last = recentSamples[recentSamples.length - 1]

    const deltaTime = (last.timestamp - first.timestamp) / 1000 // Convert to seconds
    if (deltaTime === 0) {
      return new Vector3(0, 0, 0)
    }

    const deltaPosition = last.position.clone().sub(first.position)
    const velocity = deltaPosition.divideScalar(deltaTime)

    return velocity
  }

  /**
   * Get velocity magnitude (speed)
   */
  getSpeed(): number {
    return this.getVelocity().length()
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = []
  }

  /**
   * Check if we have enough samples for velocity calculation
   */
  hasEnoughSamples(): boolean {
    return this.samples.length >= 2
  }
}
