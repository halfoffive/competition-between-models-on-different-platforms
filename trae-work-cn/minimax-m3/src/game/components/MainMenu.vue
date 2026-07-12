<script setup lang="ts">
import { ref } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const emit = defineEmits<{ (e: 'start'): void }>()

const seedInput = ref(store.seed)
const mode = ref<'survival' | 'creative'>(store.mode)
const difficulty = ref<'peaceful' | 'easy' | 'normal' | 'hard'>(store.difficulty)

function start() {
  store.setSeed(seedInput.value.trim() || 'voxelcraft')
  store.setMode(mode.value)
  store.difficulty = difficulty.value
  emit('start')
}

function randomSeed() {
  const s = Math.floor(Math.random() * 1e9).toString()
  seedInput.value = s
}
</script>

<template>
  <div class="main-menu">
    <div class="menu-bg">
      <div class="block-layer">
        <div class="block" v-for="i in 60" :key="i" :style="`--i:${i}`" />
      </div>
    </div>
    <div class="menu-content">
      <h1 class="title">VOXELCRAFT</h1>
      <p class="subtitle">浏览器中的方块世界</p>

      <div class="field">
        <label>世界种子</label>
        <div class="seed-row">
          <input v-model="seedInput" type="text" placeholder="输入任意字符串或数字" />
          <button class="icon-btn" @click="randomSeed" title="随机">⚂</button>
        </div>
      </div>

      <div class="field">
        <label>游戏模式</label>
        <div class="toggle">
          <button :class="{ active: mode === 'survival' }" @click="mode = 'survival'">生存</button>
          <button :class="{ active: mode === 'creative' }" @click="mode = 'creative'">创造</button>
        </div>
      </div>

      <div class="field">
        <label>难度</label>
        <div class="toggle">
          <button :class="{ active: difficulty === 'peaceful' }" @click="difficulty = 'peaceful'">和平</button>
          <button :class="{ active: difficulty === 'easy' }" @click="difficulty = 'easy'">简单</button>
          <button :class="{ active: difficulty === 'normal' }" @click="difficulty = 'normal'">普通</button>
          <button :class="{ active: difficulty === 'hard' }" @click="difficulty = 'hard'">困难</button>
        </div>
      </div>

      <button class="start-btn" @click="start">开始游戏</button>

      <div class="controls-help">
        <h3>操作</h3>
        <div class="controls-grid">
          <div><kbd>WASD</kbd> 移动</div>
          <div><kbd>Space</kbd> 跳跃</div>
          <div><kbd>Shift</kbd> 潜行</div>
          <div><kbd>Ctrl</kbd> 疾跑</div>
          <div><kbd>E</kbd> 物品栏</div>
          <div><kbd>1-9</kbd> 切换物品</div>
          <div><kbd>F</kbd> 飞行 (创造)</div>
          <div><kbd>F3</kbd> 调试</div>
          <div><kbd>ESC</kbd> 暂停</div>
        </div>
        <h3>方块操作</h3>
        <div class="controls-grid">
          <div><kbd>左键</kbd> 破坏 / 攻击</div>
          <div><kbd>右键</kbd> 放置 / 使用</div>
          <div><kbd>滚轮</kbd> 切换热栏</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-menu {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%);
  color: #e4e6ff;
  z-index: 100;
  overflow: hidden;
}
.menu-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.block-layer {
  position: absolute;
  inset: -100px;
}
.block {
  position: absolute;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(120, 130, 200, 0.2) 0%, rgba(60, 70, 120, 0.2) 100%);
  border: 1px solid rgba(150, 160, 230, 0.1);
  animation: float 12s linear infinite;
  animation-delay: calc(var(--i) * -0.4s);
  left: calc((var(--i) * 79) % 110vw);
  top: calc((var(--i) * 137) % 110vh);
  opacity: 0.5;
}
@keyframes float {
  0% { transform: translateY(0) rotate(0deg); }
  100% { transform: translateY(-100vh) rotate(360deg); }
}
.menu-content {
  position: relative;
  background: rgba(20, 22, 40, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(150, 160, 230, 0.2);
  border-radius: 12px;
  padding: 40px;
  width: min(520px, 92vw);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  max-height: 92vh;
  overflow-y: auto;
}
.title {
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 8px;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, #b0b8ff 0%, #6ce0d0 50%, #ffce6c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 4px 12px rgba(120, 130, 230, 0.3);
}
.subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  color: #a0a8d0;
  letter-spacing: 0.1em;
}
.field {
  margin-bottom: 18px;
}
.field label {
  display: block;
  font-size: 12px;
  color: #a0a8d0;
  margin-bottom: 6px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.seed-row {
  display: flex;
  gap: 6px;
}
input[type="text"] {
  flex: 1;
  background: rgba(10, 12, 25, 0.6);
  border: 1px solid rgba(150, 160, 230, 0.2);
  color: #e4e6ff;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  font-family: 'Menlo', 'Monaco', monospace;
}
input[type="text"]:focus {
  border-color: rgba(150, 160, 230, 0.5);
}
.icon-btn {
  background: rgba(10, 12, 25, 0.6);
  border: 1px solid rgba(150, 160, 230, 0.2);
  color: #e4e6ff;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
}
.icon-btn:hover {
  background: rgba(40, 44, 80, 0.6);
}
.toggle {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.toggle button {
  flex: 1;
  background: rgba(10, 12, 25, 0.6);
  border: 1px solid rgba(150, 160, 230, 0.2);
  color: #a0a8d0;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}
.toggle button:hover {
  background: rgba(40, 44, 80, 0.6);
  color: #e4e6ff;
}
.toggle button.active {
  background: linear-gradient(135deg, #6878d0 0%, #5060b0 100%);
  border-color: rgba(150, 160, 230, 0.4);
  color: #fff;
  box-shadow: 0 4px 12px rgba(80, 100, 200, 0.3);
}
.start-btn {
  width: 100%;
  background: linear-gradient(135deg, #6ce0d0 0%, #4a90e0 100%);
  border: none;
  color: #fff;
  padding: 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-top: 12px;
  box-shadow: 0 6px 20px rgba(74, 144, 224, 0.4);
  transition: all 0.15s;
}
.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(74, 144, 224, 0.5);
}
.start-btn:active {
  transform: translateY(0);
}
.controls-help {
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid rgba(150, 160, 230, 0.1);
}
.controls-help h3 {
  font-size: 12px;
  color: #a0a8d0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 12px 0 8px;
}
.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  font-size: 12px;
  color: #c4c8e0;
}
kbd {
  display: inline-block;
  background: rgba(60, 70, 120, 0.5);
  border: 1px solid rgba(150, 160, 230, 0.3);
  padding: 1px 6px;
  border-radius: 3px;
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 11px;
  color: #e4e6ff;
  min-width: 24px;
  text-align: center;
}
</style>
