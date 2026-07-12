<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/game'
import { Game } from '@/game/Game'
import Hud from '@/components/Hud.vue'
import MainMenu from '@/components/MainMenu.vue'
import PauseMenu from '@/components/PauseMenu.vue'
import Inventory from '@/components/Inventory.vue'

const store = useGameStore()
const canvasRef = ref(null)

// Game 实例保存为 ref，事件处理器通过 .value 访问
const gameRef = ref(null)

const handleResize = () => {
  if (gameRef.value) gameRef.value.onResize()
}

// 点击 canvas：仅在游戏中且未暂停/未开背包时请求指针锁定
const handleCanvasClick = () => {
  if (store.screen === 'game' && !store.paused && !store.inventoryOpen) {
    canvasRef.value?.requestPointerLock()
  }
}

// MainMenu：开始新世界
function onStart(seed) {
  const game = gameRef.value
  if (!game) return
  // 若已有旧会话，先释放（从暂停返回主菜单再开新世界的情况）
  if (game.world || game.player) game.stopGame()
  store.paused = false
  game.startGame(seed)
}

// MainMenu：继续游戏（读档）
function onContinue() {
  const game = gameRef.value
  if (!game) return
  if (game.world || game.player) game.stopGame()
  store.paused = false
  game.loadGame()
}

// PauseMenu：继续 → 重新请求指针锁定
function onResume() {
  store.resume()
  canvasRef.value?.requestPointerLock()
}

// PauseMenu：保存
function onSave() {
  gameRef.value?.saveGame()
}

// PauseMenu：返回主菜单
function onQuit() {
  store.resume() // 清除暂停态
  gameRef.value?.stopGame()
}

onMounted(() => {
  gameRef.value = new Game(canvasRef.value, store)
  gameRef.value.start()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (gameRef.value) {
    gameRef.value.dispose()
    gameRef.value = null
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="game-canvas" @click="handleCanvasClick"></canvas>
  <div class="ui-overlay">
    <MainMenu v-if="store.screen === 'menu'" @start="onStart" @continue="onContinue" />
    <Hud
      v-if="store.screen === 'game' && !store.paused && !store.inventoryOpen"
    />
    <PauseMenu
      v-if="store.screen === 'game' && store.paused"
      @resume="onResume"
      @save="onSave"
      @quit="onQuit"
    />
    <Inventory v-if="store.screen === 'game' && store.inventoryOpen" />
  </div>
</template>

<style scoped>
.game-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: block;
}

.ui-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
</style>
