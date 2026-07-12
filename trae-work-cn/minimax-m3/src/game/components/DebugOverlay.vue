<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { computed } from 'vue'
import { registry } from '@/engine/world/BlockRegistry'
import { BlockId } from '@/engine/world/BlockId'

const store = useGameStore()

const facingBlock = computed(() => {
  if (!store.selectedBlock) return null
  return registry.get(store.selectedBlock.id as BlockId)
})

const chunkPos = computed(() => {
  const x = store.position.x
  const z = store.position.z
  return { cx: Math.floor(x / 16), cz: Math.floor(z / 16) }
})
</script>

<template>
  <div class="debug">
    <div class="row"><span>VoxelCraft 0.1.0</span><span class="dim">· debug overlay</span></div>
    <div class="row">
      <span>XYZ</span>
      <span>{{ store.position.x.toFixed(3) }} / {{ store.position.y.toFixed(3) }} / {{ store.position.z.toFixed(3) }}</span>
    </div>
    <div class="row">
      <span>Chunk</span>
      <span>{{ chunkPos.cx }}, {{ chunkPos.cz }} ({{ store.chunkCount }} loaded)</span>
    </div>
    <div class="row">
      <span>Facing</span>
      <span>{{ store.yaw.toFixed(2) }} / {{ store.pitch.toFixed(2) }} rad</span>
    </div>
    <div class="row">
      <span>Block</span>
      <span v-if="facingBlock">{{ store.selectedBlock?.x }} {{ store.selectedBlock?.y }} {{ store.selectedBlock?.z }} · {{ facingBlock.name }}</span>
      <span v-else>— (looking at air)</span>
    </div>
    <div class="row">
      <span>Time</span>
      <span>{{ store.timeString }} ({{ store.isDay ? 'day' : 'night' }})</span>
    </div>
    <div class="row">
      <span>Mode</span>
      <span>{{ store.mode }} · {{ store.difficulty }}</span>
    </div>
    <div class="row">
      <span>FPS</span>
      <span>{{ store.fps.toFixed(0) }}</span>
    </div>
  </div>
</template>

<style scoped>
.debug {
  position: fixed;
  top: 8px;
  left: 8px;
  font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 12px;
  border-radius: 4px;
  z-index: 8;
  pointer-events: none;
  text-shadow: 1px 1px 0 #000;
  line-height: 1.5;
  max-width: 50vw;
}
.row {
  display: flex;
  gap: 12px;
}
.row span:first-child {
  min-width: 60px;
  color: #6ce0d0;
}
.dim {
  color: #888;
}
</style>
