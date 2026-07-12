<template>
  <div v-if="visible" class="debug-info">
    <div class="debug-line">FPS: {{ fps }}</div>
    <div class="debug-line">Position: {{ position }}</div>
    <div class="debug-line">Chunks: {{ chunkCount }}</div>
    <div class="debug-line">Blocks: {{ blockCount }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const fps = ref(0)
const position = ref('0, 0, 0')
const chunkCount = ref(0)
const blockCount = ref(0)

let frameCount = 0
let lastTime = performance.now()

const updateFPS = () => {
  frameCount++
  const currentTime = performance.now()
  const deltaTime = currentTime - lastTime
  
  if (deltaTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / deltaTime)
    frameCount = 0
    lastTime = currentTime
  }
  
  requestAnimationFrame(updateFPS)
}

const handleKeyDown = (e) => {
  if (e.key === 'F3') {
    e.preventDefault()
    visible.value = !visible.value
  }
}

const updateDebugInfo = (event) => {
  const { position: pos, chunks, blocks } = event.detail
  position.value = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`
  chunkCount.value = chunks
  blockCount.value = blocks
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('debugInfoUpdate', updateDebugInfo)
  updateFPS()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('debugInfoUpdate', updateDebugInfo)
})
</script>

<style scoped>
.debug-info {
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  z-index: 1000;
  pointer-events: none;
}

.debug-line {
  margin: 2px 0;
}
</style>
