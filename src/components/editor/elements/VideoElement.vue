<template>
  <div
    class="video-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <div v-if="!element.content" class="video-placeholder" @click="openVideoDialog">
      <v-icon size="32" color="grey">mdi-video</v-icon>
      <span>Click to add video</span>
    </div>
    <video
      v-else
      :src="element.content"
      controls
      class="video-player"
      @error="handleVideoError"
    ></video>
    <div v-if="isSelected" class="resize-handle" @mousedown.stop="startResize"></div>

    <v-dialog v-model="videoDialog" max-width="500">
      <v-card>
        <v-card-title>Add Video</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="videoUrl"
            label="Video URL"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mb-4"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="videoDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveVideo">Add Video</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DocumentElement } from '../../../types/document'

const props = defineProps<{
  element: DocumentElement
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'update:element', element: DocumentElement): void
}>()

const videoDialog = ref(false)
const videoUrl = ref('')
const videoError = ref(false)

// Drag & drop functionality
let isDragging = false
let startX = 0
let startY = 0
let startLeft = 0
let startTop = 0

// Resize functionality
let isResizing = false
let startWidth = 0
let startHeight = 0

const elementStyle = computed(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    height: `${props.element.size.height}px`,
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    border: props.isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
    zIndex: props.element.zIndex ?? 0
  }
})

function openVideoDialog() {
  videoUrl.value = props.element.content || ''
  videoDialog.value = true
}

function saveVideo() {
  if (videoUrl.value) {
    const updatedElement = {
      ...props.element,
      content: videoUrl.value
    }
    emit('update:element', updatedElement)
  }
  videoDialog.value = false
}

function handleVideoError() {
  videoError.value = true
}

function startDrag(event: MouseEvent) {
  isDragging = true
  startX = event.clientX
  startY = event.clientY
  startLeft = props.element.position.x
  startTop = props.element.position.y

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(event: MouseEvent) {
  if (!isDragging) return

  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY

  const newPosition = {
    x: startLeft + deltaX,
    y: startTop + deltaY
  }

  const updatedElement = {
    ...props.element,
    position: newPosition
  }

  emit('update:element', updatedElement)
}

function stopDrag() {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

function startResize(event: MouseEvent) {
  isResizing = true
  startX = event.clientX
  startY = event.clientY
  startWidth = props.element.size.width
  startHeight = props.element.size.height

  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

function onResize(event: MouseEvent) {
  if (!isResizing) return

  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY

  // Maintain 16:9 aspect ratio
  const aspectRatio = 16/9
  const newWidth = Math.max(200, startWidth + deltaX)
  const newHeight = newWidth / aspectRatio

  const newSize = {
    width: newWidth,
    height: newHeight
  }

  const updatedElement = {
    ...props.element,
    size: newSize
  }

  emit('update:element', updatedElement)
}

function stopResize() {
  isResizing = false
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}
</script>

<style scoped lang="scss">
.video-element {
  position: absolute;
  cursor: move;
  overflow: hidden;

  &.selected {
    outline: none;
  }
}

.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background-color: #eee;
  }
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary);
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
  z-index: 1;
  border-radius: 2px;
}
</style>