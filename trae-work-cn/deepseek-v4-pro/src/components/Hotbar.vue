<template>
  <div class="hotbar">
    <div class="hotbar-inner">
      <div
        v-for="(block, index) in blocks"
        :key="block.id"
        class="slot"
        :class="{ active: selectedIndex === index }"
        @click="selectSlot(index)"
      >
        <div class="slot-color" :style="{ backgroundColor: block.color }"></div>
        <span class="slot-label">{{ index + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BLOCK_TYPES } from '../game/BlockTypes.js'

const blocks = [
  { id: BLOCK_TYPES.GRASS, name: '草方块', color: '#7ec850' },
  { id: BLOCK_TYPES.DIRT, name: '泥土', color: '#8b7355' },
  { id: BLOCK_TYPES.STONE, name: '石头', color: '#808080' },
  { id: BLOCK_TYPES.WOOD, name: '木头', color: '#8b6914' },
  { id: BLOCK_TYPES.LEAVES, name: '树叶', color: '#3a7734' },
  { id: BLOCK_TYPES.SAND, name: '沙子', color: '#ded172' },
  { id: BLOCK_TYPES.WATER, name: '水', color: '#3366cc' },
]

const selectedIndex = ref(0)
const emit = defineEmits(['select'])

function selectSlot(index) {
  selectedIndex.value = index
  emit('select', blocks[index].id)
}

// 监听键盘和滚轮（由父组件传入）
function switchByDelta(delta) {
  const newIndex = (selectedIndex.value + delta + blocks.length) % blocks.length
  selectSlot(newIndex)
}

function switchByDigit(digit) {
  if (digit >= 1 && digit <= blocks.length) {
    selectSlot(digit - 1)
  }
}

defineExpose({ switchByDelta, switchByDigit, selectedIndex })
</script>

<style scoped>
.hotbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.hotbar-inner {
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.slot {
  width: 48px;
  height: 48px;
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.slot:hover {
  border-color: rgba(255, 255, 255, 0.4);
}

.slot.active {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
}

.slot-color {
  width: 100%;
  height: 100%;
  border-radius: 1px;
}

.slot-label {
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 10px;
  color: white;
  font-family: monospace;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
  pointer-events: none;
}
</style>