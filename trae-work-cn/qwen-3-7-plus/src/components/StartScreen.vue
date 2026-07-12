<template>
  <div v-if="visible" class="start-screen">
    <div class="start-content">
      <h1 class="game-title">MINECRAFT</h1>
      <p class="game-subtitle">Browser Edition</p>
      <button class="start-button" @click="startGame">开始游戏</button>
      <div class="controls-info">
        <h3>操作说明</h3>
        <p>WASD - 移动</p>
        <p>空格 - 跳跃</p>
        <p>Shift - 疾跑</p>
        <p>鼠标 - 视角</p>
        <p>左键 - 破坏方块</p>
        <p>右键 - 放置方块</p>
        <p>1-9 / 滚轮 - 切换方块</p>
        <p>F3 - 调试信息</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(true)

const emit = defineEmits(['start'])

const startGame = () => {
  visible.value = false
  emit('start')
}
</script>

<style scoped>
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.start-content {
  text-align: center;
  color: #fff;
}

.game-title {
  font-size: 64px;
  font-weight: bold;
  letter-spacing: 8px;
  margin: 0;
  text-shadow: 3px 3px 0 #333, 6px 6px 0 rgba(0,0,0,0.3);
  font-family: 'Courier New', monospace;
}

.game-subtitle {
  font-size: 18px;
  color: #aaa;
  margin: 10px 0 40px;
  letter-spacing: 4px;
}

.start-button {
  padding: 15px 60px;
  font-size: 20px;
  background: #4a7c4e;
  color: #fff;
  border: 3px solid #2d5a2d;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  transition: all 0.2s;
}

.start-button:hover {
  background: #5a9c5e;
  transform: scale(1.05);
}

.controls-info {
  margin-top: 40px;
  font-size: 14px;
  color: #888;
  line-height: 1.8;
}

.controls-info h3 {
  color: #aaa;
  margin-bottom: 10px;
}
</style>
