/**
 * Image Preview Component
 * Displays image content on a textured plane
 */

import { useState, useEffect } from 'react'
import * as THREE from 'three'

interface ImagePreviewProps {
  contentUrl: string
  width: number
  height: number
  mimeType?: string
}

export function ImagePreview({ contentUrl, width, height, mimeType }: ImagePreviewProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    console.log('[ImagePreview] Loading texture from:', contentUrl, 'mimeType:', mimeType)
    let disposed = false
    let loadedTextureRef: THREE.Texture | null = null
    let imgElement: HTMLImageElement | null = null

    // Check if it's an SVG file (need special handling)
    const isSVG = mimeType === 'image/svg+xml' || contentUrl.toLowerCase().includes('.svg') || contentUrl.startsWith('data:image/svg')

    if (isSVG) {
      // For SVG, load as image first, then create texture
      console.log('[ImagePreview] Detected SVG, using Image element loader')
      imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'

      imgElement.onload = () => {
        if (disposed) {
          imgElement = null
          return
        }
        console.log('[ImagePreview] ✓ SVG image loaded, creating texture')
        const tex = new THREE.Texture(imgElement!)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        loadedTextureRef = tex
        setTexture(tex)
        setError(false)
      }

      imgElement.onerror = (err) => {
        if (disposed) return
        console.error('[ImagePreview] ✗ Failed to load SVG as image:', err)
        setError(true)
      }

      imgElement.src = contentUrl
    } else {
      // For raster images, use TextureLoader
      console.log('[ImagePreview] Loading raster image with TextureLoader')
      const loader = new THREE.TextureLoader()

      loader.load(
        contentUrl,
        (loadedTexture) => {
          if (disposed) {
            loadedTexture.dispose()
            return
          }
          console.log('[ImagePreview] ✓ Texture loaded successfully')

          // Fix color space encoding for proper display
          loadedTexture.colorSpace = THREE.SRGBColorSpace
          loadedTexture.needsUpdate = true

          loadedTextureRef = loadedTexture
          setTexture(loadedTexture)
          setError(false)
        },
        undefined, // onProgress
        (err) => {
          if (disposed) return
          console.error('[ImagePreview] ✗ Failed to load texture:', err)
          setError(true)
        }
      )
    }

    // Cleanup on unmount or URL change
    return () => {
      disposed = true
      if (loadedTextureRef) {
        loadedTextureRef.dispose()
        console.log('[ImagePreview] Disposed texture')
      }
      if (imgElement) {
        imgElement.onload = null
        imgElement.onerror = null
        imgElement.src = ''
      }
    }
  }, [contentUrl])

  // Show loading state
  if (!texture && !error) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    )
  }

  // Show error state
  if (error || !texture) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    )
  }

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

  return (
    <mesh>
      <planeGeometry args={[displayWidth, displayHeight]} />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
      />
    </mesh>
  )
}
