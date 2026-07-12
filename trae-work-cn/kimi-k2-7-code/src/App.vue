<script setup lang="ts">
import GameCanvas from './components/GameCanvas.vue'
import Hotbar from './components/Hotbar.vue'
</script>

<template>
  <div class="game-root">
    <GameCanvas />
    <Hotbar />
    <div class="crosshair" />
  </div>
</template>

<style scoped>
.game-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.crosshair {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  user-select: none;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.85);
}

.crosshair::before {
  top: 7px;
  left: 0;
  width: 16px;
  height: 2px;
}

.crosshair::after {
  top: 0;
  left: 7px;
  width: 2px;
  height: 16px;
}
</style>
