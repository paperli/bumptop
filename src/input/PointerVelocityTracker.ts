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
  private maxSamples = 12 // Keep last 12 samples for better velocity calculation
  private maxAge = 120 // Only consider samples from last 120ms (faster response)

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
   * Uses weighted average of adjacent sample pairs for smoother results
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

    // Calculate velocity between each pair of adjacent samples
    const velocities: Vector3[] = []
    const weights: number[] = []

    for (let i = 1; i < recentSamples.length; i++) {
      const prev = recentSamples[i - 1]
      const curr = recentSamples[i]

      const deltaTime = (curr.timestamp - prev.timestamp) / 1000 // Convert to seconds
      if (deltaTime > 0) {
        const deltaPosition = curr.position.clone().sub(prev.position)
        const velocity = deltaPosition.divideScalar(deltaTime)

        // Weight more recent samples MUCH higher (exponential decay)
        // This captures the final flick motion better
        const age = now - curr.timestamp
        const weight = Math.exp(-age / 30) // 30ms decay constant (faster decay = recent samples dominate)

        velocities.push(velocity)
        weights.push(weight)
      }
    }

    if (velocities.length === 0) {
      return new Vector3(0, 0, 0)
    }

    // Weighted average of velocities
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const avgVelocity = new Vector3(0, 0, 0)

    for (let i = 0; i < velocities.length; i++) {
      avgVelocity.add(velocities[i].multiplyScalar(weights[i] / totalWeight))
    }

    return avgVelocity
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

  /**
   * Get current sample count
   */
  getSampleCount(): number {
    return this.samples.length
  }
}
