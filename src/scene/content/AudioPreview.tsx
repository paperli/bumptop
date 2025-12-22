/**
 * Audio Preview Component
 * Displays audio player UI with waveform visualization
 */

import { useState, useEffect, useRef } from 'react'
import { Html } from '@react-three/drei'

interface AudioPreviewProps {
  contentUrl: string
  width: number
  height: number
  fileName: string
}

export function AudioPreview({ contentUrl, width, height, fileName }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Initialize audio element
  useEffect(() => {
    // Guard against empty or invalid contentUrl
    if (!contentUrl || contentUrl.trim() === '') {
      console.error('[AudioPreview] Invalid contentUrl:', contentUrl)
      setError('Invalid audio URL')
      return
    }

    // Reset error state when trying to load new content
    setError(null)

    console.log(`[AudioPreview] Creating audio element for: ${contentUrl}`)

    const audio = new Audio(contentUrl)

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      console.log(`[AudioPreview] ✓ Audio loaded successfully, duration: ${audio.duration}s`)
      // Clear any error state when audio loads successfully
      setError(null)
    })

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
    })

    audio.addEventListener('error', (e) => {
      const error = audio.error
      console.error('[AudioPreview] ✗ Audio error:', {
        error: error,
        code: error?.code,
        message: error?.message,
        src: audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState,
      })
      setError(`Failed to load audio: ${error?.message || 'Unknown error'}`)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [contentUrl])

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (error) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    )
  }

  return (
    <group>
      {/* Background panel */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#4a2c7a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Audio player UI overlay */}
      <Html position={[0, 0, 0.01]} center>
        <div
          style={{
            width: `${width * 150}px`, // Convert meters to approximate pixels
            padding: '20px',
            background: 'rgba(74, 44, 122, 0.95)',
            borderRadius: '12px',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            pointerEvents: 'auto',
          }}
        >
          {/* File name */}
          <div
            style={{
              fontSize: '14px',
              marginBottom: '15px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            🎵 {fileName}
          </div>

          {/* Simple waveform visualization (static bars) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '3px',
              marginBottom: '15px',
              height: '40px',
              alignItems: 'center',
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: `${20 + Math.random() * 30}px`,
                  background: isPlaying ? '#00d4ff' : '#666',
                  borderRadius: '2px',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          {/* Play/Pause button */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <button
              onClick={togglePlayPause}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                background: '#00d4ff',
                color: 'white',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          </div>

          {/* Time display */}
          <div
            style={{
              fontSize: '12px',
              textAlign: 'center',
              color: '#ccc',
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </Html>
    </group>
  )
}
