/**
 * Content Store
 * Manages open content preview objects
 */

import { create } from 'zustand'
import { ContentObject, FileEntry } from '../types'
import { useFileStore } from './fileStore'

interface ContentState {
  // Open content objects
  contentObjects: Map<string, ContentObject>

  // Drag state (similar to fileStore)
  isDraggingContent: boolean
  draggingContentId: string | null

  // Actions
  openContent: (fileEntry: FileEntry, position: [number, number, number]) => Promise<void>
  closeContent: (contentId: string) => void
  updateContentPosition: (contentId: string, position: [number, number, number]) => void
  updateContentScale: (contentId: string, scale: number) => void
  isContentOpen: (fileId: string) => boolean
  setDraggingContent: (isDragging: boolean, contentId?: string | null) => void
}

export const useContentStore = create<ContentState>((set, get) => ({
  contentObjects: new Map(),
  isDraggingContent: false,
  draggingContentId: null,

  openContent: async (fileEntry, position) => {
    const { contentObjects } = get()

    // Check if already open
    if (contentObjects.has(fileEntry.id)) {
      console.log(`[Content] File ${fileEntry.id} already open`)
      return
    }

    // Create content object
    const contentObject: ContentObject = {
      id: fileEntry.id,
      fileEntry,
      position,
      scale: 1.0,
      isLoading: true,
    }

    // Add to map
    const newMap = new Map(contentObjects)
    newMap.set(fileEntry.id, contentObject)
    set({ contentObjects: newMap })

    console.log(`[Content] Opening file: ${fileEntry.name} at position [${position.join(', ')}]`)

    // Load content asynchronously
    try {
      const provider = useFileStore.getState().provider
      if (!provider) {
        throw new Error('No file system provider available')
      }

      const contentHandle = await provider.getFileContent(fileEntry)

      // Update with loaded content
      const updatedMap = new Map(get().contentObjects)
      const existing = updatedMap.get(fileEntry.id)
      if (existing) {
        updatedMap.set(fileEntry.id, {
          ...existing,
          contentUrl: contentHandle.url,
          isLoading: false,
        })
        set({ contentObjects: updatedMap })
        console.log(`[Content] Loaded content for: ${fileEntry.name}`)
      }
    } catch (error) {
      console.error(`[Content] Failed to load content for ${fileEntry.name}:`, error)
      // Remove from map on error
      const updatedMap = new Map(get().contentObjects)
      updatedMap.delete(fileEntry.id)
      set({ contentObjects: updatedMap })
    }
  },

  closeContent: (contentId) => {
    const { contentObjects } = get()
    const content = contentObjects.get(contentId)

    if (!content) {
      return
    }

    console.log(`[Content] Closing content: ${content.fileEntry.name}`)

    // Clean up content URL (revoke blob URL if needed)
    if (content.contentUrl && content.contentUrl.startsWith('blob:')) {
      URL.revokeObjectURL(content.contentUrl)
      console.log(`[Content] Revoked blob URL for: ${content.fileEntry.name}`)
    }

    // Remove from map
    const newMap = new Map(contentObjects)
    newMap.delete(contentId)
    set({ contentObjects: newMap })
  },

  updateContentPosition: (contentId, position) => {
    const { contentObjects } = get()
    const content = contentObjects.get(contentId)

    if (!content) {
      return
    }

    const newMap = new Map(contentObjects)
    newMap.set(contentId, { ...content, position })
    set({ contentObjects: newMap })
  },

  updateContentScale: (contentId, scale) => {
    const { contentObjects } = get()
    const content = contentObjects.get(contentId)

    if (!content) {
      return
    }

    const newMap = new Map(contentObjects)
    newMap.set(contentId, { ...content, scale })
    set({ contentObjects: newMap })
  },

  isContentOpen: (fileId) => {
    return get().contentObjects.has(fileId)
  },

  setDraggingContent: (isDragging, contentId = null) => {
    set({
      isDraggingContent: isDragging,
      draggingContentId: isDragging ? contentId : null,
    })
    console.log(`[Content] Dragging: ${isDragging}, contentId: ${contentId}`)
  },
}))
