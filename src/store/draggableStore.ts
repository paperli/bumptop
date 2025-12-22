/**
 * Unified Draggable Store
 * Manages drag state for all draggable objects (files, content, etc.)
 */

import { create } from 'zustand'
import { DraggableObjectType } from '../types/draggable'

interface DraggableState {
  // Unified drag state
  isDragging: boolean
  draggingObjectId: string | null
  draggingObjectType: DraggableObjectType | null

  // Actions
  setDragging: (isDragging: boolean, objectId?: string | null, objectType?: DraggableObjectType | null) => void
  isDraggingObject: (objectId: string) => boolean
  isDraggingType: (objectType: DraggableObjectType) => boolean
}

export const useDraggableStore = create<DraggableState>((set, get) => ({
  isDragging: false,
  draggingObjectId: null,
  draggingObjectType: null,

  setDragging: (isDragging, objectId = null, objectType = null) => {
    set({
      isDragging,
      draggingObjectId: isDragging ? objectId : null,
      draggingObjectType: isDragging ? objectType : null,
    })
    console.log(
      `[Draggable] Dragging: ${isDragging}, ` +
        `objectId: ${objectId}, ` +
        `objectType: ${objectType}`
    )
  },

  isDraggingObject: (objectId) => {
    const state = get()
    return state.isDragging && state.draggingObjectId === objectId
  },

  isDraggingType: (objectType) => {
    const state = get()
    return state.isDragging && state.draggingObjectType === objectType
  },
}))
