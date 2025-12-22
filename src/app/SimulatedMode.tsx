/**
 * Simulated Mode Component
 * Renders a 3D scene without WebXR (fallback mode for non-AR devices)
 * Phase 2: Added Rapier physics engine
 */

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { DeskBoundary } from '../scene/DeskBoundary'
import { TestCube } from '../scene/TestCube'
import { useAppStore } from '../store/appStore'
import { getPhysicsWorldConfig } from '../utils/physicsConfig'

export function SimulatedMode() {
  const settings = useAppStore((state) => state.settings)
  const physicsConfig = getPhysicsWorldConfig(settings)

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

      {/* Physics World (Rapier) */}
      <Physics
        gravity={physicsConfig.gravity}
        timeStep={physicsConfig.timestep}
        paused={false}
        debug={settings.showBoundaryWireframe}
      >
        {/* Scene with physics */}
        <DeskBoundary />

        {/* Test cube to verify physics (Phase 2) */}
        <TestCube />
      </Physics>

      {/* Controls for simulated mode */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={5}
        maxPolarAngle={Math.PI / 2}
        mouseButtons={{
          LEFT: 2, // RIGHT mouse button for rotate (was LEFT)
          MIDDLE: 1, // MIDDLE for pan
          RIGHT: 0, // LEFT for nothing (frees it up for clicking objects)
        }}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={['#1a1a1a', 3, 10]} />
    </Canvas>
  )
}
