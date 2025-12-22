/**
 * Content Object Component
 * Displays file content in a floating preview panel
 * Supports images, videos, audio, and text
 */

import { useRef, useState } from 'react'
import { RigidBody, RapierRigidBody } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { Vector3 } from 'three'
import { ContentObject as ContentObjectType } from '../types'
import { useContentStore } from '../store/contentStore'
import { useAppStore } from '../store/appStore'
import { ImagePreview } from './content/ImagePreview'
import { VideoPreview } from './content/VideoPreview'
import { AudioPreview } from './content/AudioPreview'
import { TextPreview } from './content/TextPreview'

interface ContentObjectProps {
  content: ContentObjectType
}

export function ContentObject({ content }: ContentObjectProps) {
  const settings = useAppStore((state) => state.settings)
  const closeContent = useContentStore((state) => state.closeContent)
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<Vector3 | null>(null)

  // Panel dimensions from settings
  const panelWidth = settings.defaultContentWidth
  const panelHeight = settings.defaultContentHeight

  // Handle dragging
  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    setIsDragging(true)

    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation()
      dragStartPos.current = new Vector3(pos.x, pos.y, pos.z)
    }
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !rigidBodyRef.current) return

    const worldPos = event.point
    const currentPos = rigidBodyRef.current.translation()

    // Update position on XZ plane, keep Y fixed
    rigidBodyRef.current.setTranslation(
      { x: worldPos.x, y: currentPos.y, z: worldPos.z },
      true
    )
  }

  const handlePointerUp = () => {
    setIsDragging(false)
    dragStartPos.current = null
  }

  const handleClose = () => {
    closeContent(content.id)
  }

  // Render appropriate preview based on file kind
  const renderContent = () => {
    if (content.isLoading) {
      return (
        <mesh>
          <planeGeometry args={[panelWidth, panelHeight]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      )
    }

    if (!content.contentUrl) {
      return (
        <mesh>
          <planeGeometry args={[panelWidth, panelHeight]} />
          <meshStandardMaterial color="#ff0000" />
        </mesh>
      )
    }

    switch (content.fileEntry.kind) {
      case 'image':
        return <ImagePreview contentUrl={content.contentUrl} width={panelWidth} height={panelHeight} />
      case 'video':
        return <VideoPreview contentUrl={content.contentUrl} width={panelWidth} height={panelHeight} />
      case 'audio':
        return <AudioPreview contentUrl={content.contentUrl} width={panelWidth} height={panelHeight} fileName={content.fileEntry.name} />
      case 'text':
        return <TextPreview contentUrl={content.contentUrl} width={panelWidth} height={panelHeight} fileName={content.fileEntry.name} />
      default:
        return (
          <mesh>
            <planeGeometry args={[panelWidth, panelHeight]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        )
    }
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematic"
      colliders={false}
      position={content.position}
    >
      <group>
        {/* Content panel */}
        <group
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {renderContent()}
        </group>

        {/* Close button (HTML overlay) */}
        <Html position={[panelWidth / 2 - 0.02, panelHeight / 2 - 0.02, 0]} center>
          <button
            onClick={handleClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255, 59, 48, 0.9)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            ×
          </button>
        </Html>

        {/* Filename label */}
        <Html position={[0, panelHeight / 2 + 0.03, 0]} center>
          <div
            style={{
              color: '#cccccc',
              fontSize: '14px',
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 0 4px black',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            {content.fileEntry.name}
          </div>
        </Html>
      </group>
    </RigidBody>
  )
}
