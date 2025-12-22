/**
 * Simulated Mode Component
 * Renders a 3D scene without WebXR (fallback mode for non-AR devices)
 * Phase 2: Added Rapier physics engine
 * Phase 3: Added file objects with MockProvider
 */

import { useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Physics, RapierRigidBody } from '@react-three/rapier'
import { DeskBoundary } from '../scene/DeskBoundary'
import { FileObject } from '../scene/FileObject'
import { ContentObject } from '../scene/ContentObject'
import { useAppStore } from '../store/appStore'
import { useFileStore } from '../store/fileStore'
import { useContentStore } from '../store/contentStore'
import { useDraggableStore } from '../store/draggableStore'
import { useAuthStore } from '../store/authStore'
import { getPhysicsWorldConfig } from '../utils/physicsConfig'
import { MockProvider } from '../fs/MockProvider'

// Component that monitors and constrains all file and content positions
function BoundaryEnforcer({
  fileRefs,
  contentRefs,
}: {
  fileRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
  contentRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
}) {
  const settings = useAppStore((state) => state.settings)

  useFrame(() => {
    const halfWidth = settings.deskWidth / 2
    const halfHeight = settings.deskHeight / 2
    const fileMargin = 0.04 // 4cm safety margin for files
    const contentMargin = 0.1 // 10cm larger margin for content panels

    // Enforce boundaries for files
    fileRefs.current.forEach((rigidBody, fileId) => {
      if (!rigidBody) return

      const pos = rigidBody.translation()
      let needsCorrection = false
      let newX = pos.x
      let newZ = pos.z

      // Check X bounds
      if (pos.x < -halfWidth + fileMargin) {
        newX = -halfWidth + fileMargin
        needsCorrection = true
      } else if (pos.x > halfWidth - fileMargin) {
        newX = halfWidth - fileMargin
        needsCorrection = true
      }

      // Check Z bounds
      if (pos.z < -halfHeight + fileMargin) {
        newZ = -halfHeight + fileMargin
        needsCorrection = true
      } else if (pos.z > halfHeight - fileMargin) {
        newZ = halfHeight - fileMargin
        needsCorrection = true
      }

      if (needsCorrection) {
        // Clamp position and bounce back (invert velocity with damping)
        rigidBody.setTranslation({ x: newX, y: pos.y, z: newZ }, true)

        const vel = rigidBody.linvel()
        // Instead of killing velocity, bounce it back with some energy loss
        const bounceRestitution = 0.5 // 50% energy retained on boundary bounce
        const newVelX = pos.x !== newX ? -vel.x * bounceRestitution : vel.x
        const newVelZ = pos.z !== newZ ? -vel.z * bounceRestitution : vel.z
        rigidBody.setLinvel({ x: newVelX, y: vel.y, z: newVelZ }, true)
      }
    })

    // Enforce boundaries for content objects (larger margin)
    contentRefs.current.forEach((rigidBody, contentId) => {
      if (!rigidBody) return

      const pos = rigidBody.translation()
      let needsCorrection = false
      let newX = pos.x
      let newZ = pos.z

      // Check X bounds
      if (pos.x < -halfWidth + contentMargin) {
        newX = -halfWidth + contentMargin
        needsCorrection = true
      } else if (pos.x > halfWidth - contentMargin) {
        newX = halfWidth - contentMargin
        needsCorrection = true
      }

      // Check Z bounds
      if (pos.z < -halfHeight + contentMargin) {
        newZ = -halfHeight + contentMargin
        needsCorrection = true
      } else if (pos.z > halfHeight - contentMargin) {
        newZ = halfHeight - contentMargin
        needsCorrection = true
      }

      if (needsCorrection) {
        // Clamp position and bounce back
        rigidBody.setTranslation({ x: newX, y: pos.y, z: newZ }, true)

        const vel = rigidBody.linvel()
        const bounceRestitution = 0.5
        const newVelX = pos.x !== newX ? -vel.x * bounceRestitution : vel.x
        const newVelZ = pos.z !== newZ ? -vel.z * bounceRestitution : vel.z
        rigidBody.setLinvel({ x: newVelX, y: vel.y, z: newVelZ }, true)
      }
    })
  })

  return null
}

export function SimulatedMode() {
  const settings = useAppStore((state) => state.settings)
  const physicsConfig = getPhysicsWorldConfig(settings)
  const { files, setProvider, loadFiles } = useFileStore()
  const contentObjects = useContentStore((state) => state.contentObjects)
  const isDragging = useDraggableStore((state) => state.isDragging)
  const fileRefs = useRef<Map<string, RapierRigidBody>>(new Map())
  const contentRefs = useRef<Map<string, RapierRigidBody>>(new Map())

  // Initialize MockProvider and load files on mount (only if no provider exists)
  useEffect(() => {
    // Only initialize MockProvider if no provider is set AND not authenticated
    // This prevents overwriting DropboxProvider when switching
    const { provider } = useFileStore.getState()
    const { isAuthenticated } = useAuthStore.getState()

    if (!provider && !isAuthenticated) {
      console.log('[SimulatedMode] No provider found, initializing MockProvider')
      const mockProvider = new MockProvider()
      setProvider(mockProvider)
      loadFiles()
    } else if (isAuthenticated && !provider) {
      console.log('[SimulatedMode] Waiting for Dropbox provider to be restored...')
    }
  }, []) // Empty dependency array - only run once on mount

  // Debug: Log loaded files when they change
  useEffect(() => {
    if (files.length > 0) {
      console.log('[SimulatedMode] Files loaded:', files.length)
      console.log('[SimulatedMode] File types:', {
        images: files.filter(f => f.kind === 'image').length,
        videos: files.filter(f => f.kind === 'video').length,
        audio: files.filter(f => f.kind === 'audio').length,
        text: files.filter(f => f.kind === 'text').length,
      })
    }
  }, [files])

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
          <FileObject
            key={file.id}
            file={file}
            position={filePositions[index]}
            onRefReady={(fileId, ref) => {
              if (ref) {
                fileRefs.current.set(fileId, ref)
              } else {
                fileRefs.current.delete(fileId)
              }
            }}
          />
        ))}

        {/* Boundary enforcer - continuously monitors all file and content positions */}
        <BoundaryEnforcer fileRefs={fileRefs} contentRefs={contentRefs} />

        {/* Content objects (Phase 4) - floating preview panels */}
        {Array.from(contentObjects.values()).map((content) => (
          <ContentObject
            key={content.id}
            content={content}
            onRefReady={(contentId, ref) => {
              if (ref) {
                contentRefs.current.set(contentId, ref)
              } else {
                contentRefs.current.delete(contentId)
              }
            }}
          />
        ))}
      </Physics>

      {/* Controls for simulated mode */}
      <OrbitControls
        enabled={!isDragging}
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
