/**
 * AR Mode Component
 * Implements WebXR immersive-ar session with hand tracking
 * Uses @react-three/xr for XR session management
 */

import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { XR, XRStore } from '@react-three/xr'
import { Physics, RapierRigidBody } from '@react-three/rapier'
import { DeskBoundary } from '../scene/DeskBoundary'
import { FileObject } from '../scene/FileObject'
import { ContentObject } from '../scene/ContentObject'
import { useAppStore } from '../store/appStore'
import { useFileStore } from '../store/fileStore'
import { useContentStore } from '../store/contentStore'
import { getPhysicsWorldConfig } from '../utils/physicsConfig'

// Component that monitors and constrains all file and content positions
function BoundaryEnforcer({
  fileRefs,
  contentRefs,
}: {
  fileRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
  contentRefs: React.MutableRefObject<Map<string, RapierRigidBody>>
}) {
  const settings = useAppStore((state) => state.settings)

  // Note: In AR mode, we use useFrame from @react-three/fiber
  // Same boundary enforcement logic as SimulatedMode
  useEffect(() => {
    const interval = setInterval(() => {
      const halfWidth = settings.deskWidth / 2
      const halfHeight = settings.deskHeight / 2
      const fileMargin = 0.04
      const contentMargin = 0.1

      // Enforce boundaries for files
      fileRefs.current.forEach((rigidBody) => {
        if (!rigidBody) return

        const pos = rigidBody.translation()
        let needsCorrection = false
        let newX = pos.x
        let newZ = pos.z

        if (pos.x < -halfWidth + fileMargin) {
          newX = -halfWidth + fileMargin
          needsCorrection = true
        } else if (pos.x > halfWidth - fileMargin) {
          newX = halfWidth - fileMargin
          needsCorrection = true
        }

        if (pos.z < -halfHeight + fileMargin) {
          newZ = -halfHeight + fileMargin
          needsCorrection = true
        } else if (pos.z > halfHeight - fileMargin) {
          newZ = halfHeight - fileMargin
          needsCorrection = true
        }

        if (needsCorrection) {
          rigidBody.setTranslation({ x: newX, y: pos.y, z: newZ }, true)
          const vel = rigidBody.linvel()
          const bounceRestitution = 0.5
          const newVelX = pos.x !== newX ? -vel.x * bounceRestitution : vel.x
          const newVelZ = pos.z !== newZ ? -vel.z * bounceRestitution : vel.z
          rigidBody.setLinvel({ x: newVelX, y: vel.y, z: newVelZ }, true)
        }
      })

      // Enforce boundaries for content objects
      contentRefs.current.forEach((rigidBody) => {
        if (!rigidBody) return

        const pos = rigidBody.translation()
        let needsCorrection = false
        let newX = pos.x
        let newZ = pos.z

        if (pos.x < -halfWidth + contentMargin) {
          newX = -halfWidth + contentMargin
          needsCorrection = true
        } else if (pos.x > halfWidth - contentMargin) {
          newX = halfWidth - contentMargin
          needsCorrection = true
        }

        if (pos.z < -halfHeight + contentMargin) {
          newZ = -halfHeight + contentMargin
          needsCorrection = true
        } else if (pos.z > halfHeight - contentMargin) {
          newZ = halfHeight - contentMargin
          needsCorrection = true
        }

        if (needsCorrection) {
          rigidBody.setTranslation({ x: newX, y: pos.y, z: newZ }, true)
          const vel = rigidBody.linvel()
          const bounceRestitution = 0.5
          const newVelX = pos.x !== newX ? -vel.x * bounceRestitution : vel.x
          const newVelZ = pos.z !== newZ ? -vel.z * bounceRestitution : vel.z
          rigidBody.setLinvel({ x: newVelX, y: vel.y, z: newVelZ }, true)
        }
      })
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [settings, fileRefs, contentRefs])

  return null
}

interface ARModeProps {
  store: XRStore
}

export function ARMode({ store }: ARModeProps) {
  const settings = useAppStore((state) => state.settings)
  const setARSessionActive = useAppStore((state) => state.setARSessionActive)
  const setMode = useAppStore((state) => state.setMode)
  const physicsConfig = getPhysicsWorldConfig(settings)
  const { files } = useFileStore()
  const contentObjects = useContentStore((state) => state.contentObjects)
  const fileRefs = useRef<Map<string, RapierRigidBody>>(new Map())
  const contentRefs = useRef<Map<string, RapierRigidBody>>(new Map())

  // Calculate grid positions for files (same as SimulatedMode)
  const getFilePositions = () => {
    const positions: Array<[number, number, number]> = []
    const deskWidth = settings.deskWidth
    const deskHeight = settings.deskHeight
    const spacing = 0.12
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

  // Monitor XR session state
  useEffect(() => {
    console.log('[ARMode] Subscribing to XR session changes...')

    // Subscribe to store changes to track session state
    const unsubscribe = store.subscribe((state) => {
      const hasSession = !!state.session

      if (hasSession) {
        console.log('[ARMode] XR session active')
        setARSessionActive(true)
      } else if (state.session === null) {
        // Session explicitly ended (not just undefined on init)
        console.log('[ARMode] XR session ended by user or system')
        setARSessionActive(false)
        // When session ends, return to simulated mode
        setMode('simulated')
      }
    })

    return () => {
      console.log('[ARMode] Unsubscribing from XR session changes')
      unsubscribe()
    }
  }, [store, setARSessionActive, setMode])

  return (
    <Canvas
      style={{ width: '100vw', height: '100vh' }}
      gl={{ alpha: true }} // Transparent background for AR
    >
      <XR store={store}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        {/* XR Controllers and Hands are automatically rendered by the XR component */}

        {/* Physics World */}
        <Physics
          gravity={physicsConfig.gravity}
          timeStep={physicsConfig.timestep}
          paused={false}
          debug={settings.showBoundaryWireframe}
        >
          {/* Scene components */}
          <DeskBoundary />

          {/* File objects */}
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

          {/* Content objects */}
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

          {/* Boundary enforcer */}
          <BoundaryEnforcer fileRefs={fileRefs} contentRefs={contentRefs} />
        </Physics>
      </XR>
    </Canvas>
  )
}
