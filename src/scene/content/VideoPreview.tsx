/**
 * Video Preview Component
 * Displays video content with play/pause controls
 */

import { useState, useEffect, useRef } from 'react'
import { VideoTexture } from 'three'
import { Html } from '@react-three/drei'

interface VideoPreviewProps {
  contentUrl: string
  width: number
  height: number
}

export function VideoPreview({ contentUrl, width, height }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize video element and texture
  useEffect(() => {
    const video = document.createElement('video')
    video.src = contentUrl
    video.crossOrigin = 'anonymous'
    video.loop = true
    video.muted = false
    video.playsInline = true

    video.addEventListener('loadeddata', () => {
      console.log('[VideoPreview] Video loaded')
      const texture = new VideoTexture(video)
      setVideoTexture(texture)
    })

    video.addEventListener('error', (e) => {
      console.error('[VideoPreview] Video error:', e)
      setError('Failed to load video')
    })

    videoRef.current = video

    return () => {
      // Cleanup
      if (videoTexture) {
        videoTexture.dispose()
        console.log('[VideoPreview] Disposed video texture')
      }
      video.pause()
      video.src = ''
      video.load()
    }
  }, [contentUrl])

  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  if (error) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    )
  }

  if (!videoTexture) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    )
  }

  // Calculate aspect ratio
  const video = videoRef.current
  const videoAspect = video ? video.videoWidth / video.videoHeight : 16 / 9
  const panelAspect = width / height

  let displayWidth = width
  let displayHeight = height

  if (videoAspect > panelAspect) {
    displayHeight = width / videoAspect
  } else {
    displayWidth = height * videoAspect
  }

  return (
    <group>
      {/* Video plane */}
      <mesh>
        <planeGeometry args={[displayWidth, displayHeight]} />
        <meshStandardMaterial
          map={videoTexture}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Play/Pause button overlay */}
      <Html position={[0, 0, 0.01]} center>
        <button
          onClick={togglePlayPause}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </Html>
    </group>
  )
}
