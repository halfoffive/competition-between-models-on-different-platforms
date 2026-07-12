<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { PLACEABLE_BLOCK_TYPES, BLOCK_DEFS } from '@/blocks/BlockType'
import { gameState, setSelectedIndex, cycleSelectedIndex } from '@/stores/gameState'

const slots = PLACEABLE_BLOCK_TYPES.map((type, index) => ({
  type,
  name: BLOCK_DEFS[type].name,
  index,
  key: index + 1,
}))

function onWheel(e: WheelEvent): void {
  cycleSelectedIndex(e.deltaY > 0 ? 1 : -1)
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.code.startsWith('Digit')) {
    const num = Number(e.code.replace('Digit', ''))
    if (num >= 1 && num <= 9) {
      setSelectedIndex(num - 1)
    }
  }
}

onMounted(() => {
  document.addEventListener('wheel', onWheel)
  document.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('wheel', onWheel)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="hotbar">
    <div
      v-for="slot in slots"
      :key="slot.index"
      class="slot"
      :class="{ active: gameState.selectedIndex === slot.index }"
    >
      <span class="slot-number">{{ slot.key }}</span>
      <span class="slot-name">{{ slot.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.hotbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  user-select: none;
  pointer-events: none;
}

.slot {
  width: 56px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  position: relative;
}

.slot.active {
  border-color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
}

.slot-number {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  opacity: 0.7;
}

.slot-name {
  font-size: 10px;
  text-align: center;
  padding: 0 2px;
  line-height: 1.1;
}
</style>
