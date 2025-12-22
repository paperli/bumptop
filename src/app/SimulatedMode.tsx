/**
 * Simulated Mode Component
 * Renders a 3D scene without WebXR (fallback mode for non-AR devices)
 * Phase 2: Added Rapier physics engine
 * Phase 3: Added file objects with MockProvider
 */

import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { DeskBoundary } from '../scene/DeskBoundary'
import { FileObject } from '../scene/FileObject'
import { useAppStore } from '../store/appStore'
import { useFileStore } from '../store/fileStore'
import { getPhysicsWorldConfig } from '../utils/physicsConfig'
import { MockProvider } from '../fs/MockProvider'

export function SimulatedMode() {
  const settings = useAppStore((state) => state.settings)
  const physicsConfig = getPhysicsWorldConfig(settings)
  const { files, setProvider, loadFiles, isDraggingFile } = useFileStore()

  // Initialize MockProvider and load files on mount
  useEffect(() => {
    const provider = new MockProvider()
    setProvider(provider)
    loadFiles()
  }, [setProvider, loadFiles])

  // Calculate grid positions for files
  const getFilePositions = () => {
    const positions: Array<[number, number, number]> = []
    const deskWidth = settings.deskWidth
    const deskHeight = settings.deskHeight
    const fileSize = 0.08
    const spacing = 0.12 // 12cm between files
    const cols = Math.floor(deskWidth / spacing)
    const rows = Math.floor(deskHeight / spacing)

    let fileIndex = 0
    for (let row = 0; row < rows && fileIndex < files.length; row++) {
      for (let col = 0; col < cols && fileIndex < files.length; col++) {
        const x = (col - cols / 2) * spacing + spacing / 2
        const z = (row - rows / 2) * spacing + spacing / 2
        const y = 0.2 // Start slightly above desk
        positions.push([x, y, z])
        fileIndex++
      }
    }

    return positions
  }

  const filePositions = getFilePositions()

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

        {/* File objects (Phase 3) */}
        {files.map((file, index) => (
          <FileObject key={file.id} file={file} position={filePositions[index]} />
        ))}
      </Physics>

      {/* Controls for simulated mode */}
      <OrbitControls
        enabled={!isDraggingFile}
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
