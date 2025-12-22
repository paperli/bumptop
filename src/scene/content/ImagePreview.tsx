/**
 * Image Preview Component
 * Displays image content on a textured plane
 */

import { useTexture } from '@react-three/drei'
import { useEffect } from 'react'

interface ImagePreviewProps {
  contentUrl: string
  width: number
  height: number
}

export function ImagePreview({ contentUrl, width, height }: ImagePreviewProps) {
  const texture = useTexture(contentUrl)

  // Calculate aspect ratio and fit to panel
  const imageAspect = texture.image ? texture.image.width / texture.image.height : 1
  const panelAspect = width / height

  let displayWidth = width
  let displayHeight = height

  if (imageAspect > panelAspect) {
    // Image is wider than panel
    displayHeight = width / imageAspect
  } else {
    // Image is taller than panel
    displayWidth = height * imageAspect
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      texture.dispose()
      console.log('[ImagePreview] Disposed texture')
    }
  }, [texture])

  return (
    <mesh>
      <planeGeometry args={[displayWidth, displayHeight]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  )
}
