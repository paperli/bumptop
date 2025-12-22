/**
 * Test Cube Component
 * Phase 2: Test object to verify physics is working
 * Can be clicked to apply an impulse (throw)
 */

import { useRef, useState } from 'react'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { useAppStore } from '../store/appStore'
import { getPhysicsMaterial, getDampingConfig } from '../utils/physicsConfig'
import { ThreeEvent } from '@react-three/fiber'

export function TestCube() {
  const settings = useAppStore((state) => state.settings)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isHovered, setIsHovered] = useState(false)

  const material = getPhysicsMaterial(settings)
  const damping = getDampingConfig(settings)

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()

    if (rigidBodyRef.current) {
      // Apply a random impulse to throw the cube
      const impulse = {
        x: (Math.random() - 0.5) * 2,
        y: Math.random() * 3 + 1,
        z: (Math.random() - 0.5) * 2,
      }

      rigidBodyRef.current.applyImpulse(impulse, true)

      console.log('TestCube thrown with impulse:', impulse)
    }
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders="cuboid"
      position={[0, 0.3, 0]} // Start slightly above desk
      restitution={material.restitution}
      friction={material.friction}
      linearDamping={damping.linear}
      angularDamping={damping.angular}
      ccd={true} // Continuous Collision Detection (prevents tunneling)
    >
      <mesh
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshStandardMaterial
          color={isHovered ? '#667eea' : '#ff6b6b'}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>
    </RigidBody>
  )
}
