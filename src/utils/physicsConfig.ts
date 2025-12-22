/**
 * Physics Configuration
 * Constants and utilities for Rapier physics engine
 */

import { AppSettings } from './settingsStorage'

export interface PhysicsWorldConfig {
  gravity: [number, number, number]
  timestep?: number // fixed timestep in seconds (default: 1/60)
  iterations?: number // solver iterations (higher = more stable)
}

/**
 * Get physics world configuration from app settings
 */
export function getPhysicsWorldConfig(settings: AppSettings): PhysicsWorldConfig {
  return {
    gravity: [0, settings.gravity, 0], // Y-axis gravity
    timestep: 1 / 60, // 60 Hz fixed timestep
    iterations: 8, // Rapier default is 4, we use 8 for better stability
  }
}

/**
 * Physics material properties for file objects
 */
export interface PhysicsMaterial {
  restitution: number // bounciness (0 = no bounce, 1 = perfect bounce)
  friction: number // surface friction (0 = ice, 1 = rubber)
  density?: number // mass per unit volume
}

/**
 * Get physics material from settings
 */
export function getPhysicsMaterial(settings: AppSettings): PhysicsMaterial {
  return {
    restitution: settings.restitution,
    friction: settings.friction,
    density: 1.0, // Default density
  }
}

/**
 * Damping configuration (reduces velocity over time)
 */
export interface DampingConfig {
  linear: number // linear velocity damping (0-1, higher = more damping)
  angular: number // angular velocity damping (0-1, higher = more damping)
}

/**
 * Get damping configuration from settings
 */
export function getDampingConfig(settings: AppSettings): DampingConfig {
  return {
    linear: settings.linearDamping,
    angular: settings.angularDamping,
  }
}

/**
 * Constants for physics simulation
 */
export const PHYSICS_CONSTANTS = {
  // Boundary wall height (tall enough to contain thrown objects)
  WALL_HEIGHT: 0.5, // meters

  // Boundary wall thickness
  WALL_THICKNESS: 0.05, // meters (5cm)

  // Maximum throw velocity (to prevent objects from going too fast)
  MAX_THROW_VELOCITY: 10, // m/s

  // Collision groups (bitflags)
  COLLISION_GROUP_DESK: 0x0001, // Desk plane
  COLLISION_GROUP_BOUNDARY: 0x0002, // Boundary walls
  COLLISION_GROUP_FILE: 0x0004, // File objects
  COLLISION_GROUP_CONTENT: 0x0008, // Content preview objects
} as const
