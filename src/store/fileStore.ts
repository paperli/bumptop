/**
 * File Store
 * Manages file entries and selection state
 */

import { create } from 'zustand'
import { FileEntry, FileSystemProvider } from '../types'

interface FileState {
  // File entries loaded from provider
  files: FileEntry[]

  // Currently selected file IDs
  selectedFileIds: Set<string>

  // Current file system provider
  provider: FileSystemProvider | null

  // Loading state
  isLoading: boolean
  error: string | null

  // Dragging state (to disable OrbitControls during drag)
  isDraggingFile: boolean

  // Actions
  setProvider: (provider: FileSystemProvider) => void
  loadFiles: () => Promise<void>
  selectFile: (fileId: string) => void
  deselectFile: (fileId: string) => void
  toggleFileSelection: (fileId: string) => void
  clearSelection: () => void
  isFileSelected: (fileId: string) => boolean
  setDraggingFile: (isDragging: boolean) => void
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  selectedFileIds: new Set(),
  provider: null,
  isLoading: false,
  error: null,
  isDraggingFile: false,

  setProvider: (provider) => {
    set({ provider })
  },

  loadFiles: async () => {
    const { provider } = get()
    if (!provider) {
      set({ error: 'No provider set' })
      return
    }

    set({ isLoading: true, error: null })

    try {
      const files = await provider.listFixedFolder()
      set({ files, isLoading: false })
      console.log(`Loaded ${files.length} files from provider`)
    } catch (error) {
      console.error('Failed to load files:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to load files',
        isLoading: false,
      })
    }
  },

  selectFile: (fileId) => {
    set((state) => {
      const newSelected = new Set(state.selectedFileIds)
      newSelected.add(fileId)
      return { selectedFileIds: newSelected }
    })
  },

  deselectFile: (fileId) => {
    set((state) => {
      const newSelected = new Set(state.selectedFileIds)
      newSelected.delete(fileId)
      return { selectedFileIds: newSelected }
    })
  },

  toggleFileSelection: (fileId) => {
    const { selectedFileIds } = get()
    if (selectedFileIds.has(fileId)) {
      get().deselectFile(fileId)
    } else {
      get().selectFile(fileId)
    }
  },

  clearSelection: () => {
    set({ selectedFileIds: new Set() })
  },

  isFileSelected: (fileId) => {
    return get().selectedFileIds.has(fileId)
  },

  setDraggingFile: (isDragging) => {
    set({ isDraggingFile: isDragging })
  },
}))
