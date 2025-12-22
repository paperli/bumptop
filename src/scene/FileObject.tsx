/**
 * File Object Component
 * 3D representation of a file with physics
 * Phase 3: Basic version with selection
 */

import { useRef, useState, useEffect, Suspense } from 'react'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Text, useTexture } from '@react-three/drei'
import { FileEntry } from '../types'
import { useAppStore } from '../store/appStore'
import { useFileStore } from '../store/fileStore'
import { getPhysicsMaterial, getDampingConfig } from '../utils/physicsConfig'
import { useGestures } from '../hooks/useGestures'

interface FileObjectProps {
  file: FileEntry
  position: [number, number, number]
  onRefReady?: (fileId: string, ref: RapierRigidBody | null) => void
}

export function FileObject({ file, position, onRefReady }: FileObjectProps) {
  const settings = useAppStore((state) => state.settings)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isHovered, setIsHovered] = useState(false)

  const material = getPhysicsMaterial(settings)
  const damping = getDampingConfig(settings)

  // Register rigid body ref when ready
  useEffect(() => {
    if (onRefReady && rigidBodyRef.current) {
      onRefReady(file.id, rigidBodyRef.current)
    }
    return () => {
      if (onRefReady) {
        onRefReady(file.id, null)
      }
    }
  }, [file.id, onRefReady])

  // Load thumbnail texture
  const texture = useTexture(file.thumbnailUrl || '/mock-assets/images/placeholder-1.png')

  // File object size (8cm from PRD)
  const FILE_SIZE = 0.08

  // Gesture handlers for drag and throw (no selection)
  const { gestureHandlers } = useGestures({
    rigidBodyRef,
    fileId: file.id, // Pass file ID to track which file is being dragged
    minThrowSpeed: 0.05, // Lower threshold for more responsive throwing
    maxThrowSpeed: 8.0, // Higher max speed for long distance throws (3.0 → 8.0)
    dragSmoothing: 0.1, // More responsive tracking (0.2 → 0.1)
  })

  // Color based on hover state only
  const getColor = () => {
    if (isHovered) return '#888888' // Gray when hovered
    return '#444444' // Dark gray default
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders="cuboid"
      position={position}
      restitution={material.restitution}
      friction={material.friction}
      linearDamping={damping.linear}
      angularDamping={damping.angular}
      ccd={true}
    >
      <group>
        {/* File box with thumbnail on top */}
        <mesh
          castShadow
          receiveShadow
          {...gestureHandlers}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          <boxGeometry args={[FILE_SIZE, FILE_SIZE * 0.3, FILE_SIZE]} />

          {/* Sides (colored material) */}
          <meshStandardMaterial
            attach="material-0"
            color={getColor()}
            roughness={0.6}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach="material-1"
            color={getColor()}
            roughness={0.6}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach="material-2"
            color={getColor()}
            roughness={0.6}
            metalness={0.2}
          />
          <meshStandardMaterial
            attach="material-3"
            color={getColor()}
            roughness={0.6}
            metalness={0.2}
          />

          {/* Top face (thumbnail texture) */}
          <meshStandardMaterial
            attach="material-4"
            map={texture}
            roughness={0.4}
            metalness={0.1}
          />

          {/* Bottom face */}
          <meshStandardMaterial
            attach="material-5"
            color={getColor()}
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>

        {/* Filename label above the file */}
        <Text
          position={[0, FILE_SIZE * 0.15 + 0.03, 0]}
          fontSize={0.012}
          color="#cccccc"
          anchorX="center"
          anchorY="bottom"
          maxWidth={FILE_SIZE * 1.2}
          outlineWidth={0.002}
          outlineColor="#000000"
        >
          {file.name}
        </Text>
      </group>
    </RigidBody>
  )
}
