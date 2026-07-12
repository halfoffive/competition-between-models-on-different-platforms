<script setup>
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { BLOCK, BLOCKS } from '@/game/blocks.js'
import { getBlockIconDataURL } from '@/game/textures.js'
import { matchRecipe } from '@/game/recipes.js'

const store = useGameStore()

// 合成网格：9 格平铺数组（null 或 blockId）
const grid = ref(Array(9).fill(null))

// 材料库：可无限取用的方块列表（创造模式风格）
const materials = [
  BLOCK.GRASS,
  BLOCK.DIRT,
  BLOCK.STONE,
  BLOCK.COBBLESTONE,
  BLOCK.SAND,
  BLOCK.LOG,
  BLOCK.LEAVES,
  BLOCK.PLANKS,
  BLOCK.GLASS,
  BLOCK.COAL_ORE,
  BLOCK.IRON_ORE,
  BLOCK.CACTUS
]

// 将平铺网格转为 3x3 二维数组供配方匹配
function toMatrix(flat) {
  return [
    [flat[0], flat[1], flat[2]],
    [flat[3], flat[4], flat[5]],
    [flat[6], flat[7], flat[8]]
  ]
}

// 当前合成结果
const result = computed(() => matchRecipe(toMatrix(grid.value)))
const resultIcon = computed(() =>
  result.value ? getBlockIconDataURL(result.value.id) : ''
)

// 点击材料：填入第一个空槽
function addMaterial(blockId) {
  const idx = grid.value.indexOf(null)
  if (idx === -1) return
  grid.value[idx] = blockId
}

// 点击网格槽：清除该槽
function clearSlot(i) {
  grid.value[i] = null
}

// 点击输出槽：取出产物，写入当前选中快捷栏槽位，并清空网格
function takeResult() {
  if (!result.value) return
  store.setHotbarSlot(store.selectedSlot, result.value.id)
  grid.value = Array(9).fill(null)
}

// 关闭物品栏
function close() {
  store.toggleInventory()
}

// 方块名（用于 tooltip）
function blockName(id) {
  return BLOCKS[id] ? BLOCKS[id].name : ''
}
</script>

<template>
  <div class="inv-root">
    <div class="panel">
      <h2 class="panel-title">合成</h2>

      <!-- 材料库 -->
      <div class="section">
        <div class="section-label">材料库</div>
        <div class="materials">
          <button
            v-for="m in materials"
            :key="m"
            class="slot mat-slot"
            :title="blockName(m)"
            @click="addMaterial(m)"
          >
            <img :src="getBlockIconDataURL(m)" class="icon" draggable="false" alt="" />
          </button>
        </div>
      </div>

      <!-- 合成区：网格 + 箭头 + 输出 -->
      <div class="craft-row">
        <div class="grid">
          <button
            v-for="(id, i) in grid"
            :key="i"
            class="slot grid-slot"
            @click="clearSlot(i)"
          >
            <img
              v-if="id !== null"
              :src="getBlockIconDataURL(id)"
              class="icon"
              draggable="false"
              alt=""
            />
          </button>
        </div>

        <div class="arrow">→</div>

        <button
          class="slot out-slot"
          :class="{ ready: !!result }"
          :disabled="!result"
          @click="takeResult"
        >
          <img v-if="resultIcon" :src="resultIcon" class="icon" draggable="false" alt="" />
          <span v-if="result" class="count">{{ result.count }}</span>
        </button>
      </div>

      <div class="hint">
        点击材料加入网格 · 点击网格槽清空 · 点击产物取出至选中快捷栏
      </div>

      <button class="btn close-btn" @click="close">关闭 (E)</button>
    </div>
  </div>
</template>

<style scoped>
.inv-root {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  font-family: 'Press Start 2P', 'Courier New', monospace;
  color: #e8e8e8;
  z-index: 45;
  user-select: none;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px 28px;
  background: rgba(20, 20, 25, 0.92);
  border: 2px solid #5a5a5a;
  box-shadow:
    inset 2px 2px 0 #3a3a44,
    inset -2px -2px 0 #000,
    0 0 0 4px #000;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  letter-spacing: 2px;
  text-shadow: 2px 2px 0 #2a2a2a;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.section-label {
  font-size: 9px;
  color: #9a9aa6;
}
.materials {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 320px;
}

/* 通用槽位：48x48，Minecraft 风深灰底 + 浅灰内框 */
.slot {
  width: 48px;
  height: 48px;
  padding: 0;
  background: #8b8b8b;
  border: 2px solid #373737;
  box-shadow: inset 2px 2px 0 #c6c6c6, inset -2px -2px 0 #5a5a5a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}
.slot:hover {
  background: #9a9a9a;
}
.icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
  -ms-interpolation-mode: nearest-neighbor;
  pointer-events: none;
  user-select: none;
}

/* 合成区一行 */
.craft-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 4px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 48px);
  grid-template-rows: repeat(3, 48px);
  gap: 4px;
}
.arrow {
  font-size: 18px;
  color: #b8b8c0;
}
.out-slot {
  background: #8b8b8b;
}
.out-slot.ready {
  border-color: #7fff7f;
  box-shadow: inset 2px 2px 0 #c6c6c6, inset -2px -2px 0 #5a5a5a, 0 0 6px #7fff7f;
}
.out-slot:disabled {
  cursor: default;
}
.count {
  position: absolute;
  bottom: 1px;
  right: 3px;
  font-size: 10px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #000;
}

.hint {
  font-size: 8px;
  color: #7a7a82;
  text-align: center;
  max-width: 320px;
  line-height: 1.6;
}

.btn {
  padding: 10px 16px;
  font-family: inherit;
  font-size: 11px;
  color: #e8e8e8;
  background: #4a4a5a;
  border: 2px solid #1a1a22;
  box-shadow:
    inset 2px 2px 0 #6a6a7a,
    inset -2px -2px 0 #2a2a34,
    2px 2px 0 #000;
  cursor: pointer;
}
.btn:hover {
  background: #5a5a6a;
}
.btn:active {
  box-shadow: inset 2px 2px 0 #2a2a34, inset -2px -2px 0 #6a6a7a;
  transform: translate(1px, 1px);
}
</style>
