/**
 * Simulated Mode Component
 * Renders a 3D scene without WebXR (fallback mode for non-AR devices)
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { DeskBoundary } from '../scene/DeskBoundary'

export function SimulatedMode() {
  return (
    <Canvas
      camera={{
        position: [0, 1.5, 1.5],
        fov: 50,
      }}
      shadows
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Scene */}
      <DeskBoundary />

      {/* Controls for simulated mode */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={['#1a1a1a', 3, 10]} />
    </Canvas>
  )
}
