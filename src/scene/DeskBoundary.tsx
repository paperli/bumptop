/**
 * Desk Boundary Component
 * Phase 2: Added physics walls using Rapier RigidBody
 */

import { RigidBody } from '@react-three/rapier'
import { useAppStore } from '../store/appStore'
import { PHYSICS_CONSTANTS } from '../utils/physicsConfig'
import * as THREE from 'three'

export function DeskBoundary() {
  const settings = useAppStore((state) => state.settings)
  const { deskWidth, deskHeight } = settings

  const wallHeight = PHYSICS_CONSTANTS.WALL_HEIGHT
  const wallThickness = PHYSICS_CONSTANTS.WALL_THICKNESS

  return (
    <group>
      {/* Desk plane (visual + physics) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[deskWidth, deskHeight]} />
          <meshStandardMaterial
            color="#2a2a2a"
            roughness={0.8}
            metalness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Grid helper for visualization */}
      <gridHelper
        args={[Math.max(deskWidth, deskHeight), 10, '#666666', '#444444']}
        position={[0, 0.001, 0]}
      />

      {/* Invisible boundary walls (physics only) */}
      {/* North wall (positive Z) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, wallHeight / 2, deskHeight / 2]}>
        <mesh visible={false}>
          <boxGeometry args={[deskWidth, wallHeight, wallThickness]} />
        </mesh>
      </RigidBody>

      {/* South wall (negative Z) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, wallHeight / 2, -deskHeight / 2]}>
        <mesh visible={false}>
          <boxGeometry args={[deskWidth, wallHeight, wallThickness]} />
        </mesh>
      </RigidBody>

      {/* East wall (positive X) */}
      <RigidBody type="fixed" colliders="cuboid" position={[deskWidth / 2, wallHeight / 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, deskHeight]} />
        </mesh>
      </RigidBody>

      {/* West wall (negative X) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-deskWidth / 2, wallHeight / 2, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[wallThickness, wallHeight, deskHeight]} />
        </mesh>
      </RigidBody>
    </group>
  )
}
