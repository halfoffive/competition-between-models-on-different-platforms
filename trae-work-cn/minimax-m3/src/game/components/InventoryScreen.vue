<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { computed, ref, watch } from 'vue'
import { BlockId } from '@/engine/world/BlockId'
import { findRecipe } from '@/engine/crafting/Recipes'
import { registry } from '@/engine/world/BlockRegistry'

const store = useGameStore()
const emit = defineEmits<{ (e: 'close'): void }>()

// 玩家 2x2 合成网格
const grid2x2 = ref<(BlockId | null)[]>([null, null, null, null])

const recipe2x2 = computed(() => findRecipe(grid2x2.value))

function clearGrid() {
  for (let i = 0; i < grid2x2.value.length; i++) grid2x2.value[i] = null
}

function pickupResult() {
  if (!recipe2x2.value) return
  // 消耗材料
  for (let i = 0; i < grid2x2.value.length; i++) {
    if (grid2x2.value[i] !== null) {
      grid2x2.value[i] = null
    }
  }
  store.pushToast(`合成了 ${registry.get(recipe2x2.value.result.id).name} x${recipe2x2.value.result.count}`)
  // 给玩家
  for (let i = 0; i < 36; i++) {
    const inv = store.inventory[i]
    if (inv && inv.id === recipe2x2.value.result.id && inv.count < 64) {
      inv.count = Math.min(64, inv.count + recipe2x2.value.result.count)
      return
    }
  }
  for (let i = 0; i < 36; i++) {
    if (!store.inventory[i]) {
      store.inventory[i] = { id: recipe2x2.value.result.id, count: recipe2x2.value.result.count }
      return
    }
  }
}

function setGridSlot(idx: number, id: BlockId | null) {
  grid2x2.value[idx] = id
}

function quickAdd(slotIdx: number) {
  const inv = store.inventory[slotIdx]
  if (!inv) return
  for (let i = 0; i < grid2x2.value.length; i++) {
    if (grid2x2.value[i] === null) {
      grid2x2.value[i] = inv.id
      inv.count--
      if (inv.count <= 0) store.inventory[slotIdx] = null
      return
    }
  }
}

function quickRemove(idx: number) {
  const id = grid2x2.value[idx]
  if (id === null) return
  // 还给玩家
  for (let i = 0; i < 36; i++) {
    const inv = store.inventory[i]
    if (inv && inv.id === id && inv.count < 64) {
      inv.count++
      grid2x2.value[idx] = null
      return
    }
  }
  for (let i = 0; i < 36; i++) {
    if (!store.inventory[i]) {
      store.inventory[i] = { id, count: 1 }
      grid2x2.value[idx] = null
      return
    }
  }
}

function tileColor(id: BlockId | null): string {
  if (id === null) return 'transparent'
  const map: Partial<Record<BlockId, string>> = {
    [BlockId.OAK_PLANKS]: '#b88a4a',
    [BlockId.OAK_LOG]: '#7a5832',
    [BlockId.SPRUCE_LOG]: '#3a2a1a',
    [BlockId.COBBLESTONE]: '#6b6b6b',
    [BlockId.STONE]: '#7e7e7e',
    [BlockId.STICK]: '#8a6238',
    [BlockId.COAL]: '#222',
    [BlockId.IRON_INGOT]: '#dadada',
    [BlockId.GOLD_INGOT]: '#f4d044',
    [BlockId.DIAMOND]: '#5cf',
    [BlockId.WHEAT]: '#d4a050',
    [BlockId.SAND]: '#e6d6a0',
    [BlockId.DIRT]: '#8b5a2b',
  }
  return map[id] || '#888'
}
</script>

<template>
  <div class="inventory-overlay" @click.self="emit('close')">
    <div class="inventory-panel">
      <h2>物品栏</h2>
      <p class="hint">2×2 合成 · 点击原料格放置物品，点击结果格拿取</p>

      <div class="craft-row">
        <div class="grid-2x2">
          <div
            v-for="i in 4"
            :key="i"
            class="cell"
            :style="{ background: tileColor(grid2x2[i-1]) }"
            @click="grid2x2[i-1] !== null && quickRemove(i-1)"
          >
            <span v-if="grid2x2[i-1] !== null" class="icon" :title="registry.get(grid2x2[i-1]!).name" />
          </div>
        </div>
        <div class="arrow">➜</div>
        <div
          class="result-cell"
          :class="{ active: !!recipe2x2 }"
          :style="recipe2x2 ? { background: tileColor(recipe2x2.result.id) } : {}"
          @click="pickupResult"
        >
          <span v-if="recipe2x2" class="result-icon" :title="registry.get(recipe2x2.result.id).name"></span>
          <span v-if="recipe2x2" class="result-count">×{{ recipe2x2.result.count }}</span>
        </div>
      </div>

      <h3>背包</h3>
      <div class="inventory-grid">
        <div
          v-for="(item, i) in store.inventory"
          :key="i"
          class="cell"
          :class="{ hotbar: i < 9 }"
          :style="{ background: item ? tileColor(item.id) : 'transparent' }"
          @click="i >= 9 && quickAdd(i)"
          :title="item ? registry.get(item.id).name : ''"
        >
          <span v-if="item" class="icon"></span>
          <span v-if="item && item.count > 1" class="count">{{ item.count }}</span>
        </div>
      </div>

      <button class="close-btn" @click="emit('close')">关闭 (E)</button>
    </div>
  </div>
</template>

<style scoped>
.inventory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(2px);
}
.inventory-panel {
  background: rgba(30, 30, 50, 0.96);
  border: 1px solid rgba(150, 160, 230, 0.3);
  border-radius: 8px;
  padding: 24px;
  color: #e4e6ff;
  max-width: 92vw;
  max-height: 92vh;
  overflow-y: auto;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  min-width: 480px;
}
h2 {
  margin: 0 0 4px;
  font-size: 20px;
  color: #b0b8ff;
}
h3 {
  margin: 16px 0 8px;
  font-size: 14px;
  color: #a0a8d0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: #8888a0;
}
.craft-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.grid-2x2 {
  display: grid;
  grid-template-columns: repeat(2, 50px);
  grid-template-rows: repeat(2, 50px);
  gap: 4px;
}
.arrow {
  font-size: 20px;
  color: #a0a8d0;
}
.result-cell {
  position: relative;
  width: 50px;
  height: 50px;
  background: rgba(60, 70, 120, 0.4);
  border: 2px solid rgba(150, 160, 230, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-cell.active {
  border-color: #ffce6c;
  box-shadow: 0 0 12px rgba(255, 206, 108, 0.4);
  cursor: pointer;
}
.result-count {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 11px;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
}
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(9, 50px);
  gap: 4px;
}
.cell {
  position: relative;
  width: 50px;
  height: 50px;
  background: rgba(20, 22, 40, 0.6);
  border: 1px solid rgba(150, 160, 230, 0.2);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.1s;
}
.cell:hover {
  border-color: rgba(150, 160, 230, 0.5);
}
.cell.hotbar {
  border-color: rgba(255, 255, 255, 0.2);
}
.icon {
  width: 36px;
  height: 36px;
  background: inherit;
  border-radius: 3px;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3), inset 2px 2px 0 rgba(255, 255, 255, 0.15);
}
.count {
  position: absolute;
  bottom: 0;
  right: 2px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
}
.close-btn {
  margin-top: 16px;
  background: rgba(60, 70, 120, 0.4);
  border: 1px solid rgba(150, 160, 230, 0.3);
  color: #e4e6ff;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.close-btn:hover {
  background: rgba(80, 100, 200, 0.4);
}
</style>
