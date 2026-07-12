<template>
  <div class="game-container">
    <canvas ref="gameCanvas"></canvas>
    <div v-if="!gameStarted" class="overlay" @click="startGame">
      <div class="start-message">
        <h1>Minecraft Web</h1>
        <p>点击开始游戏</p>
        <p class="controls-hint">WASD 移动 | 鼠标控制视角 | 左键破坏 | 右键放置 | 滚轮切换方块</p>
      </div>
    </div>
    <div class="crosshair" v-if="gameStarted">+</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Game } from '../game/Game.js'
import { BLOCK_TYPES } from '../game/BlockTypes.js'

const gameCanvas = ref(null)
const gameStarted = ref(false)
let game = null

const emit = defineEmits(['hotbar-change', 'hotbar-select'])

function startGame() {
  if (gameStarted.value) return
  gameStarted.value = true
  
  game = new Game(gameCanvas.value)
  
  game.onHotbarChange = (delta) => {
    emit('hotbar-change', delta)
  }
  game.onHotbarSelect = (index) => {
    emit('hotbar-select', index)
  }
  
  game.start()
}

onUnmounted(() => {
  if (game) game.dispose()
})

// 暴露给父组件
defineExpose({
  setBlockType(type) {
    if (game) game.setSelectedBlockType(type)
  }
})
</script>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
  position: relative;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.start-message {
  text-align: center;
  color: white;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.start-message h1 {
  font-size: 48px;
  margin-bottom: 16px;
  color: #7ec850;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.start-message p {
  font-size: 20px;
  margin-bottom: 8px;
}

.controls-hint {
  font-size: 14px !important;
  color: #aaa;
  margin-top: 16px !important;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 24px;
  font-weight: bold;
  pointer-events: none;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  z-index: 5;
}
</style>