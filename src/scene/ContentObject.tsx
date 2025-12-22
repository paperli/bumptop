/**
 * Content Object Component
 * Displays file content in a floating preview panel
 * Supports images, videos, audio, and text
 * Now with full physics and gesture support
 */

import { useRef, useEffect } from 'react'
import { RigidBody, RapierRigidBody, CuboidCollider } from '@react-three/rapier'
import { Html } from '@react-three/drei'
import { ContentObject as ContentObjectType } from '../types'
import { useContentStore } from '../store/contentStore'
import { useAppStore } from '../store/appStore'
import { useDraggableObject } from '../hooks/useDraggableObject'
import { ImagePreview } from './content/ImagePreview'
import { VideoPreview } from './content/VideoPreview'
import { AudioPreview } from './content/AudioPreview'
import { TextPreview } from './content/TextPreview'

interface ContentObjectProps {
  content: ContentObjectType
  onRefReady?: (contentId: string, ref: RapierRigidBody | null) => void
}

export function ContentObject({ content, onRefReady }: ContentObjectProps) {
  const settings = useAppStore((state) => state.settings)
  const closeContent = useContentStore((state) => state.closeContent)
  const rigidBodyRef = useRef<RapierRigidBody>(null)

  // Panel dimensions from settings
  const panelWidth = settings.defaultContentWidth
  const panelHeight = settings.defaultContentHeight

  // Use unified gesture system for drag and throw
  const { gestureHandlers } = useDraggableObject({
    rigidBodyRef,
    objectId: content.id,
    objectType: 'content',
    config: {
      maxThrowSpeed: 5.0,
      dragSmoothing: 0.2,
      boundaryMargin: 0.1, // Larger margin for content panels
    },
  })

  // Notify parent when ref is ready or unmounted
  useEffect(() => {
    if (onRefReady && rigidBodyRef.current) {
      onRefReady(content.id, rigidBodyRef.current)
    }

    return () => {
      if (onRefReady) {
        onRefReady(content.id, null)
      }
    }
  }, [content.id, onRefReady])

  const handleClose = () => {
    closeContent(content.id)
  }

  // Render appropriate preview based on file kind
  const renderContent = () => {
    console.log(`[ContentObject] Rendering content for ${content.fileEntry.name}:`, {
      isLoading: content.isLoading,
      hasContentUrl: !!content.contentUrl,
      contentUrl: content.contentUrl,
      kind: content.fileEntry.kind,
    })

    if (content.isLoading) {
      console.log(`[ContentObject] Showing loading state (gray panel)`)
      return (
        <mesh>
          <planeGeometry args={[panelWidth, panelHeight]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      )
    }

    if (!content.contentUrl) {
      console.error(`[ContentObject] ERROR: No contentUrl! Showing red error panel`)
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
      type="dynamic"
      colliders={false} // Manually define colliders below
      position={content.position}
      restitution={settings.restitution}
      friction={settings.friction}
      linearDamping={settings.linearDamping}
      angularDamping={settings.angularDamping}
      lockRotations={true} // Keep panels upright
      gravityScale={0} // Float in air
      mass={2.0} // Heavier than file objects for strong collisions
      ccd={true} // Enable CCD to prevent tunneling at high speeds
    >
      {/* Explicit collider with substantial depth for reliable collisions */}
      <CuboidCollider args={[panelWidth / 2, panelHeight / 2, 0.03]} />

      <group>
        {/* Invisible hit area mesh for gesture detection - CRITICAL for pointer events */}
        <mesh {...gestureHandlers}>
          <planeGeometry args={[panelWidth, panelHeight]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Content panel */}
        <group>
          {renderContent()}
        </group>

        {/* Close button (HTML overlay) */}
        <Html position={[panelWidth / 2 - 0.02, panelHeight / 2 - 0.02, 0]} center>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
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
              pointerEvents: 'auto',
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
