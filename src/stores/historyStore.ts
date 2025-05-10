import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Document } from '../types/document'

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<Document[]>([])
  const redoStack = ref<Document[]>([])
  const isUndoing = ref(false)
  const isRedoing = ref(false)

  function pushState(document: Document) {
    if (isUndoing.value || isRedoing.value) return
    
    // Add current state to undo stack
    undoStack.value.push(JSON.parse(JSON.stringify(document)))
    
    // Clear redo stack when new changes are made
    redoStack.value = []
    
    // Limit stack size to prevent memory issues
    if (undoStack.value.length > 50) {
      undoStack.value.shift()
    }
  }

  function undo(currentDocument: Document): Document | null {
    if (undoStack.value.length === 0) return null
    
    isUndoing.value = true
    
    try {
      // Save current state to redo stack
      redoStack.value.push(JSON.parse(JSON.stringify(currentDocument)))
      
      // Get previous state
      const previousState = undoStack.value.pop()
      
      return previousState || null
    } finally {
      isUndoing.value = false
    }
  }

  function redo(currentDocument: Document): Document | null {
    if (redoStack.value.length === 0) return null
    
    isRedoing.value = true
    
    try {
      // Save current state to undo stack
      undoStack.value.push(JSON.parse(JSON.stringify(currentDocument)))
      
      // Get next state
      const nextState = redoStack.value.pop()
      
      return nextState || null
    } finally {
      isRedoing.value = false
    }
  }

  function canUndo(): boolean {
    return undoStack.value.length > 0
  }

  function canRedo(): boolean {
    return redoStack.value.length > 0
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear
  }
})