/**
 * Text Preview Component
 * Displays text content with pagination
 */

import { useState, useEffect } from 'react'
import { Html } from '@react-three/drei'

interface TextPreviewProps {
  contentUrl: string
  width: number
  height: number
  fileName: string
}

export function TextPreview({ contentUrl, width, height, fileName }: TextPreviewProps) {
  const [textContent, setTextContent] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const linesPerPage = 15
  const charsPerLine = 50

  // Load text content
  useEffect(() => {
    fetch(contentUrl)
      .then((response) => response.text())
      .then((text) => {
        setTextContent(text)
        console.log('[TextPreview] Text loaded, length:', text.length)
      })
      .catch((err) => {
        console.error('[TextPreview] Failed to load text:', err)
        setError('Failed to load text')
      })
  }, [contentUrl])

  if (error) {
    return (
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
    )
  }

  // Split text into pages
  const lines = textContent.split('\n')
  const totalPages = Math.ceil(lines.length / linesPerPage)
  const startLine = currentPage * linesPerPage
  const endLine = Math.min(startLine + linesPerPage, lines.length)
  const pageLines = lines.slice(startLine, endLine)

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <group>
      {/* Background panel */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color="#2a4d2a" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Text display overlay */}
      <Html position={[0, 0, 0.01]} center>
        <div
          style={{
            width: `${width * 150}px`, // Convert meters to approximate pixels
            height: `${height * 150}px`,
            padding: '20px',
            background: 'rgba(42, 77, 42, 0.95)',
            borderRadius: '12px',
            color: 'white',
            fontFamily: 'monospace',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* File name header */}
          <div
            style={{
              fontSize: '12px',
              marginBottom: '10px',
              textAlign: 'center',
              color: '#ccc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📄 {fileName}
          </div>

          {/* Text content */}
          <div
            style={{
              flex: 1,
              fontSize: '11px',
              lineHeight: '1.4',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.3)',
              padding: '10px',
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {textContent ? (
              pageLines.map((line, i) => (
                <div key={startLine + i}>
                  {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                </div>
              ))
            ) : (
              <div>Loading...</div>
            )}
          </div>

          {/* Pagination controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              fontSize: '12px',
            }}
          >
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 0}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: '4px',
                background: currentPage === 0 ? '#444' : '#00d4ff',
                color: 'white',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ←
            </button>
            <span style={{ color: '#ccc' }}>
              Page {currentPage + 1} / {totalPages || 1}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '5px 12px',
                border: 'none',
                borderRadius: '4px',
                background: currentPage >= totalPages - 1 ? '#444' : '#00d4ff',
                color: 'white',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}
            >
              →
            </button>
          </div>
        </div>
      </Html>
    </group>
  )
}
