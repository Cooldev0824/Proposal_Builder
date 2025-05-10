<template>
  <div class="ruler-container" v-show="visible">
    <div class="ruler horizontal" ref="horizontalRuler">
      <canvas ref="horizontalCanvas"></canvas>
    </div>
    <div class="ruler vertical" ref="verticalRuler">
      <canvas ref="verticalCanvas"></canvas>
    </div>
    <div class="ruler-corner"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'

// Import styles
import '../../assets/styles/components/ruler.scss';

const props = defineProps<{
  visible: boolean
  zoom: number
}>()

const horizontalRuler = ref<HTMLElement | null>(null)
const verticalRuler = ref<HTMLElement | null>(null)
const horizontalCanvas = ref<HTMLCanvasElement | null>(null)
const verticalCanvas = ref<HTMLCanvasElement | null>(null)

const RULER_SIZE = 20
const MAJOR_TICK_INTERVAL = 100
const MINOR_TICK_INTERVAL = 10

function drawRuler(canvas: HTMLCanvasElement, length: number, isVertical: boolean) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#f5f5f5'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.beginPath()
  ctx.strokeStyle = '#999'
  ctx.lineWidth = 1

  const scale = props.zoom

  for (let i = 0; i < length; i += MINOR_TICK_INTERVAL) {
    const pos = i * scale
    const isMajor = i % MAJOR_TICK_INTERVAL === 0

    if (isVertical) {
      ctx.moveTo(RULER_SIZE - (isMajor ? 10 : 5), pos)
      ctx.lineTo(RULER_SIZE, pos)

      if (isMajor) {
        ctx.save()
        ctx.translate(10, pos + 4)
        ctx.rotate(-Math.PI / 2)
        ctx.fillStyle = '#666'
        ctx.font = '10px Arial'
        ctx.fillText(i.toString(), 0, 0)
        ctx.restore()
      }
    } else {
      ctx.moveTo(pos, RULER_SIZE - (isMajor ? 10 : 5))
      ctx.lineTo(pos, RULER_SIZE)

      if (isMajor) {
        ctx.fillStyle = '#666'
        ctx.font = '10px Arial'
        ctx.fillText(i.toString(), pos - 10, 12)
      }
    }
  }

  ctx.stroke()
}

function updateRulers() {
  if (horizontalCanvas.value && verticalCanvas.value) {
    const parentWidth = horizontalRuler.value?.parentElement?.clientWidth || 1000
    const parentHeight = verticalRuler.value?.parentElement?.clientHeight || 1000

    horizontalCanvas.value.width = parentWidth
    horizontalCanvas.value.height = RULER_SIZE
    verticalCanvas.value.width = RULER_SIZE
    verticalCanvas.value.height = parentHeight

    drawRuler(horizontalCanvas.value, parentWidth, false)
    drawRuler(verticalCanvas.value, parentHeight, true)
  }
}

watch(() => props.visible, (newValue) => {
  if (newValue) {
    updateRulers()
  }
})

watch(() => props.zoom, () => {
  if (props.visible) {
    updateRulers()
  }
})

onMounted(() => {
  if (props.visible) {
    updateRulers()
  }

  window.addEventListener('resize', updateRulers)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateRulers)
})
</script>

