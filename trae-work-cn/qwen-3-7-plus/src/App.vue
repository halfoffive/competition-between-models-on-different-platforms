<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { GameEngine } from './game/GameEngine'
import Crosshair from './components/Crosshair.vue'
import DebugInfo from './components/DebugInfo.vue'
import Hotbar from './components/Hotbar.vue'
import StartScreen from './components/StartScreen.vue'

const canvasRef = ref(null)
let gameEngine = null
let autoSaveInterval = null

const handleStart = () => {
  if (canvasRef.value && !gameEngine) {
    gameEngine = new GameEngine(canvasRef.value)
    gameEngine.start()
    
    // 启动自动保存（每5分钟）
    autoSaveInterval = setInterval(() => {
      if (gameEngine && gameEngine.world) {
        gameEngine.world.save()
        console.log('World auto-saved')
      }
    }, 5 * 60 * 1000)
  }
}

onUnmounted(() => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval)
  }
  if (gameEngine) {
    gameEngine.stop()
  }
})
</script>

<template>
  <div class="game-container">
    <StartScreen @start="handleStart" />
    <canvas ref="canvasRef" class="game-canvas"></canvas>
    <Crosshair />
    <DebugInfo />
    <Hotbar />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
