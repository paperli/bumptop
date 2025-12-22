/**
 * Mock File System Provider
 * Returns mock file entries for testing Phase 3-4
 */

import { FileEntry, FileContentHandle, FileSystemProvider } from '../types'

export class MockProvider implements FileSystemProvider {
  id = 'mock'
  label = 'Mock Files'

  isAuthenticated(): boolean {
    return true // Always authenticated
  }

  async signIn(): Promise<void> {
    // No-op for mock provider
  }

  async signOut(): Promise<void> {
    // No-op for mock provider
  }

  async listFixedFolder(): Promise<FileEntry[]> {
    return MOCK_FILES
  }

  async getFileContent(entry: FileEntry): Promise<FileContentHandle> {
    // Map file ID to actual content URL
    const contentUrlMap: Record<string, string> = {
      // Videos - map to actual video files in public/mock-assets/videos/
      'mock-vid-1': '/mock-assets/videos/sample-1.mp4',
      'mock-vid-2': '/mock-assets/videos/sample-2.mp4',
      'mock-vid-3': '/mock-assets/videos/sample-3.mp4',
      'mock-vid-4': '/mock-assets/videos/sample-4.mp4',
      'mock-vid-5': '/mock-assets/videos/sample-5.mp4',

      // Audio - map to actual audio files in public/mock-assets/audio/
      'mock-aud-1': '/mock-assets/audio/sample-1.wav',
      'mock-aud-2': '/mock-assets/audio/sample-2.mp3',
      'mock-aud-3': '/mock-assets/audio/sample-3.wav',
      'mock-aud-4': '/mock-assets/audio/sample-4.wav',
      'mock-aud-5': '/mock-assets/audio/sample-5.wav',

      // Text - map to actual text files in public/mock-assets/text/
      'mock-txt-1': '/mock-assets/text/sample.txt',
      'mock-txt-2': '/mock-assets/text/notes.md',
      'mock-txt-3': '/mock-assets/text/sample.txt',
      'mock-txt-4': '/mock-assets/text/config.json',
      'mock-txt-5': '/mock-assets/text/sample.txt',
      'mock-txt-6': '/mock-assets/text/example.js',
      'mock-txt-7': '/mock-assets/text/notes.md',
      'mock-txt-8': '/mock-assets/text/sample.txt',
      'mock-txt-9': '/mock-assets/text/config.json',
      'mock-txt-10': '/mock-assets/text/sample.txt',
    }

    // For images, use thumbnail URL as content
    // For other types, use mapped content URL or fallback to thumbnail
    const contentUrl = contentUrlMap[entry.id] || entry.thumbnailUrl || ''

    return {
      url: contentUrl,
      mimeType: entry.mimeType,
    }
  }
}

/**
 * Mock file entries (30 files with variety)
 */
const MOCK_FILES: FileEntry[] = [
  // Images (10)
  {
    id: 'mock-img-1',
    name: 'vacation-beach.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2_500_000,
    modifiedAt: '2025-01-15T10:30:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-1.svg',
  },
  {
    id: 'mock-img-2',
    name: 'family-photo.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 3_200_000,
    modifiedAt: '2025-01-14T15:20:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-2.svg',
  },
  {
    id: 'mock-img-3',
    name: 'sunset.svg',
    kind: 'image',
    mimeType: 'image/png',
    sizeBytes: 1_800_000,
    modifiedAt: '2025-01-13T08:45:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-3.svg',
  },
  {
    id: 'mock-img-4',
    name: 'mountains.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 4_100_000,
    modifiedAt: '2025-01-12T12:00:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-4.svg',
  },
  {
    id: 'mock-img-5',
    name: 'city-night.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2_900_000,
    modifiedAt: '2025-01-11T19:30:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-5.svg',
  },
  {
    id: 'mock-img-6',
    name: 'food-dish.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2_200_000,
    modifiedAt: '2025-01-10T13:15:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-6.svg',
  },
  {
    id: 'mock-img-7',
    name: 'architecture.svg',
    kind: 'image',
    mimeType: 'image/png',
    sizeBytes: 3_500_000,
    modifiedAt: '2025-01-09T11:00:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-7.svg',
  },
  {
    id: 'mock-img-8',
    name: 'nature-forest.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 3_800_000,
    modifiedAt: '2025-01-08T09:45:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-8.svg',
  },
  {
    id: 'mock-img-9',
    name: 'abstract-art.svg',
    kind: 'image',
    mimeType: 'image/png',
    sizeBytes: 1_500_000,
    modifiedAt: '2025-01-07T16:20:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-9.svg',
  },
  {
    id: 'mock-img-10',
    name: 'pet-dog.jpg',
    kind: 'image',
    mimeType: 'image/jpeg',
    sizeBytes: 2_700_000,
    modifiedAt: '2025-01-06T14:30:00Z',
    thumbnailUrl: '/mock-assets/images/placeholder-10.svg',
  },

  // Videos (5) - Names match actual files in public/mock-assets/videos/
  {
    id: 'mock-vid-1',
    name: 'sample-1.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 13_927_646,
    modifiedAt: '2025-01-05T10:00:00Z',
    thumbnailUrl: '/mock-assets/videos/video-thumb.svg',
  },
  {
    id: 'mock-vid-2',
    name: 'sample-2.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 11_737_561,
    modifiedAt: '2025-01-04T11:30:00Z',
    thumbnailUrl: '/mock-assets/videos/video-thumb.svg',
  },
  {
    id: 'mock-vid-3',
    name: 'sample-3.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 24_826_200,
    modifiedAt: '2025-01-03T15:45:00Z',
    thumbnailUrl: '/mock-assets/videos/video-thumb.svg',
  },
  {
    id: 'mock-vid-4',
    name: 'sample-4.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 32_610_156,
    modifiedAt: '2025-01-02T18:20:00Z',
    thumbnailUrl: '/mock-assets/videos/video-thumb.svg',
  },
  {
    id: 'mock-vid-5',
    name: 'sample-5.mp4',
    kind: 'video',
    mimeType: 'video/mp4',
    sizeBytes: 61_302_091,
    modifiedAt: '2025-01-01T09:00:00Z',
    thumbnailUrl: '/mock-assets/videos/video-thumb.svg',
  },

  // Audio (5) - Names match actual files in public/mock-assets/audio/
  {
    id: 'mock-aud-1',
    name: 'sample-1.wav',
    kind: 'audio',
    mimeType: 'audio/wav',
    sizeBytes: 1_177_644,
    modifiedAt: '2024-12-31T12:00:00Z',
    thumbnailUrl: '/mock-assets/audio/audio-thumb.svg',
  },
  {
    id: 'mock-aud-2',
    name: 'sample-2.mp3',
    kind: 'audio',
    mimeType: 'audio/mpeg',
    sizeBytes: 130_865,
    modifiedAt: '2024-12-30T14:30:00Z',
    thumbnailUrl: '/mock-assets/audio/audio-thumb.svg',
  },
  {
    id: 'mock-aud-3',
    name: 'sample-3.wav',
    kind: 'audio',
    mimeType: 'audio/wav',
    sizeBytes: 8_623_204,
    modifiedAt: '2024-12-29T16:45:00Z',
    thumbnailUrl: '/mock-assets/audio/audio-thumb.svg',
  },
  {
    id: 'mock-aud-4',
    name: 'sample-4.wav',
    kind: 'audio',
    mimeType: 'audio/wav',
    sizeBytes: 8_707_458,
    modifiedAt: '2024-12-28T10:15:00Z',
    thumbnailUrl: '/mock-assets/audio/audio-thumb.svg',
  },
  {
    id: 'mock-aud-5',
    name: 'sample-5.wav',
    kind: 'audio',
    mimeType: 'audio/wav',
    sizeBytes: 13_547_564,
    modifiedAt: '2024-12-27T08:30:00Z',
    thumbnailUrl: '/mock-assets/audio/audio-thumb.svg',
  },

  // Text files (10)
  {
    id: 'mock-txt-1',
    name: 'meeting-notes.txt',
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 4_500,
    modifiedAt: '2025-01-20T09:00:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-2',
    name: 'README.md',
    kind: 'text',
    mimeType: 'text/markdown',
    sizeBytes: 8_200,
    modifiedAt: '2025-01-19T11:30:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-3',
    name: 'todo-list.txt',
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 1_800,
    modifiedAt: '2025-01-18T15:45:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-4',
    name: 'config.json',
    kind: 'text',
    mimeType: 'application/json',
    sizeBytes: 3_200,
    modifiedAt: '2025-01-17T13:20:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-5',
    name: 'ideas-brainstorm.txt',
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 6_100,
    modifiedAt: '2025-01-16T10:00:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-6',
    name: 'code-snippet.js',
    kind: 'text',
    mimeType: 'text/javascript',
    sizeBytes: 2_400,
    modifiedAt: '2025-01-15T14:30:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-7',
    name: 'recipe.md',
    kind: 'text',
    mimeType: 'text/markdown',
    sizeBytes: 5_300,
    modifiedAt: '2025-01-14T12:15:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-8',
    name: 'journal-entry.txt',
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 7_800,
    modifiedAt: '2025-01-13T19:00:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-9',
    name: 'package.json',
    kind: 'text',
    mimeType: 'application/json',
    sizeBytes: 2_900,
    modifiedAt: '2025-01-12T16:45:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
  {
    id: 'mock-txt-10',
    name: 'letter-draft.txt',
    kind: 'text',
    mimeType: 'text/plain',
    sizeBytes: 4_100,
    modifiedAt: '2025-01-11T11:20:00Z',
    thumbnailUrl: '/mock-assets/text/text-thumb.svg',
  },
]
