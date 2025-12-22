/**
 * Desk Boundary Component
 * Renders the desk plane (visual representation of the desk surface)
 * Physics walls will be added in Phase 2
 */

import { useAppStore } from '../store/appStore'
import * as THREE from 'three'

export function DeskBoundary() {
  const settings = useAppStore((state) => state.settings)
  const { deskWidth, deskHeight } = settings

  return (
    <group>
      {/* Desk plane (visual) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[deskWidth, deskHeight]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.8}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid helper for visualization */}
      <gridHelper
        args={[Math.max(deskWidth, deskHeight), 10, '#666666', '#444444']}
        position={[0, 0.001, 0]}
      />
    </group>
  )
}
