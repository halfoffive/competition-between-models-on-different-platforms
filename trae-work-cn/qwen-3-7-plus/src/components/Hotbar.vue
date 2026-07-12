<template>
  <div class="hotbar">
    <div
      v-for="(slot, index) in slots"
      :key="index"
      class="hotbar-slot"
      :class="{ active: index === selectedIndex }"
    >
      <div class="block-icon" :style="{ backgroundColor: getBlockColor(slot) }"></div>
      <div class="slot-number">{{ index + 1 }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BlockType } from '../game/Block.js'

const selectedIndex = ref(0)

const slots = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.LEAVES,
  BlockType.SAND,
  BlockType.COBBLESTONE,
  BlockType.PLANKS,
  BlockType.GLASS
]

const getBlockColor = (blockType) => {
  const colors = {
    [BlockType.GRASS]: '#4a7c4e',
    [BlockType.DIRT]: '#8b6f47',
    [BlockType.STONE]: '#808080',
    [BlockType.WOOD]: '#8b5a2b',
    [BlockType.LEAVES]: '#2d5a2d',
    [BlockType.SAND]: '#d4b895',
    [BlockType.COBBLESTONE]: '#6b6b6b',
    [BlockType.PLANKS]: '#b8864f',
    [BlockType.GLASS]: '#c8e6ff'
  }
  return colors[blockType] || '#ffffff'
}

const handleKeyDown = (e) => {
  const key = parseInt(e.key)
  if (key >= 1 && key <= 9) {
    selectedIndex.value = key - 1
    // 同步到 BlockInteraction
    window.dispatchEvent(new CustomEvent('hotbarSelectionChanged', {
      detail: { index: selectedIndex.value }
    }))
  }
}

const handleWheel = (e) => {
  if (e.deltaY > 0) {
    selectedIndex.value = (selectedIndex.value + 1) % slots.length
  } else {
    selectedIndex.value = (selectedIndex.value - 1 + slots.length) % slots.length
  }
  // 同步到 BlockInteraction
  window.dispatchEvent(new CustomEvent('hotbarSelectionChanged', {
    detail: { index: selectedIndex.value }
  }))
}

const handleBlockTypeChanged = (e) => {
  const blockType = e.detail.blockType
  const index = slots.indexOf(blockType)
  if (index !== -1) {
    selectedIndex.value = index
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('wheel', handleWheel)
  window.addEventListener('blockTypeChanged', handleBlockTypeChanged)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('wheel', handleWheel)
  window.removeEventListener('blockTypeChanged', handleBlockTypeChanged)
})
</script>

<style scoped>
.hotbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  z-index: 1000;
}

.hotbar-slot {
  width: 48px;
  height: 48px;
  background: rgba(139, 139, 139, 0.3);
  border: 2px solid #555;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.1s ease;
}

.hotbar-slot:hover {
  border-color: #aaa;
}

.hotbar-slot.active {
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.block-icon {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  image-rendering: pixelated;
}

.slot-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 10px;
  color: #fff;
  text-shadow: 1px 1px 2px #000;
  font-weight: bold;
}
</style>
