<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['start', 'continue'])
const store = useGameStore()

const seedInput = ref('')
const showSettings = ref(false)

// 新世界：读取种子（空则用时间戳随机），写入 store 并通知 App 启动
function startNew() {
  const raw = seedInput.value.trim()
  const seed = raw === '' ? Date.now() : Number(raw)
  store.worldSeed = Number.isFinite(seed) ? seed : Date.now()
  store.setScreen('game')
  emit('start', store.worldSeed)
}

// 继续游戏：交给 App 处理读档
function continueGame() {
  if (!store.hasSave) return
  store.setScreen('game')
  emit('continue')
}

function toggleSettings() {
  showSettings.value = !showSettings.value
}
</script>

<template>
  <div class="menu-root">
    <div class="menu-content">
      <h1 class="title">VOXEL CRAFT</h1>
      <p class="subtitle">一个浏览器体素沙盒游戏</p>

      <div class="seed-row">
        <label class="seed-label" for="seed">种子</label>
        <input
          id="seed"
          v-model="seedInput"
          class="seed-input"
          type="text"
          inputmode="numeric"
          placeholder="留空随机"
        />
      </div>

      <div class="buttons">
        <button class="btn" @click="startNew">新世界</button>
        <button class="btn" :disabled="!store.hasSave" @click="continueGame">
          继续游戏
        </button>
        <button class="btn" @click="toggleSettings">
          {{ showSettings ? '收起设置' : '设置' }}
        </button>
      </div>

      <div v-if="showSettings" class="settings-panel">
        <label class="setting-label" for="rd">
          渲染距离：{{ store.renderDistance }} 区块
        </label>
        <input
          id="rd"
          v-model.number="store.renderDistance"
          class="slider"
          type="range"
          min="2"
          max="12"
          step="1"
        />
      </div>
    </div>

    <div class="controls-hint">
      WASD 移动 · 鼠标视角 · 左键破坏 · 右键放置 · E 物品栏 · ESC 暂停 · 双击空格飞行
    </div>
  </div>
</template>

<style scoped>
.menu-root {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  color: #e8e8e8;
  background:
    radial-gradient(ellipse at center, #2a2a36 0%, #15151c 70%, #0d0d12 100%);
  z-index: 50;
  user-select: none;
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

/* 标题：多层 text-shadow 模拟方块 3D 厚度 */
.title {
  margin: 0;
  font-size: 48px;
  letter-spacing: 4px;
  color: #f4f4f4;
  text-shadow:
    3px 3px 0 #3a3a3a,
    6px 6px 0 #2a2a2a,
    9px 9px 0 #1a1a1a,
    9px 9px 12px rgba(0, 0, 0, 0.6);
}

.subtitle {
  margin: 0;
  font-size: 12px;
  color: #9a9aa6;
  letter-spacing: 1px;
}

.seed-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}
.seed-label {
  font-size: 11px;
  color: #b8b8c0;
}
.seed-input {
  width: 200px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
  color: #e8e8e8;
  background: #1a1a22;
  border: 2px solid #5a5a5a;
  box-shadow: inset 2px 2px 0 #000;
  outline: none;
}
.seed-input::placeholder {
  color: #6a6a72;
}
.seed-input:focus {
  border-color: #7fff7f;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
  width: 240px;
}

/* 像素风按钮：方块凸起 + 内嵌高光 */
.btn {
  padding: 12px 16px;
  font-family: inherit;
  font-size: 13px;
  color: #e8e8e8;
  background: #4a4a5a;
  border: 2px solid #1a1a22;
  box-shadow:
    inset 2px 2px 0 #6a6a7a,
    inset -2px -2px 0 #2a2a34,
    2px 2px 0 #000;
  cursor: pointer;
  transition: background 0.08s;
}
.btn:hover:not(:disabled) {
  background: #5a5a6a;
}
.btn:active:not(:disabled) {
  box-shadow:
    inset 2px 2px 0 #2a2a34,
    inset -2px -2px 0 #6a6a7a;
  transform: translate(1px, 1px);
}
.btn:disabled {
  background: #33333d;
  color: #6a6a72;
  cursor: not-allowed;
  box-shadow: inset 2px 2px 0 #2a2a34, inset -2px -2px 0 #1a1a22;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(20, 20, 25, 0.85);
  border: 2px solid #5a5a5a;
}
.setting-label {
  font-size: 10px;
  color: #b8b8c0;
}
.slider {
  width: 200px;
  accent-color: #7fff7f;
}

.controls-hint {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  color: #6a6a72;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .title {
    font-size: 32px;
  }
  .controls-hint {
    font-size: 7px;
    white-space: normal;
    text-align: center;
    max-width: 90vw;
  }
}
</style>
