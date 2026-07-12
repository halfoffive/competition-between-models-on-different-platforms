<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'

const emit = defineEmits(['resume', 'save', 'quit'])
const store = useGameStore()

const showSettings = ref(false)

// 继续：恢复状态并通知 App 重新请求指针锁定
function onResume() {
  store.resume()
  emit('resume')
}

function onSave() {
  emit('save')
}

function onQuit() {
  showSettings.value = false
  emit('quit')
}
</script>

<template>
  <div class="pause-root">
    <div class="panel">
      <h2 class="panel-title">已暂停</h2>

      <div class="buttons">
        <button class="btn" @click="onResume">继续</button>
        <button class="btn" @click="onSave">保存世界</button>
        <button class="btn" @click="showSettings = !showSettings">
          {{ showSettings ? '收起设置' : '设置' }}
        </button>
        <button class="btn btn-danger" @click="onQuit">返回主菜单</button>
      </div>

      <div v-if="showSettings" class="settings-panel">
        <label class="setting-label" for="rd-pause">
          渲染距离：{{ store.renderDistance }} 区块
        </label>
        <input
          id="rd-pause"
          v-model.number="store.renderDistance"
          class="slider"
          type="range"
          min="2"
          max="12"
          step="1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pause-root {
  position: fixed;
  inset: 0;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  font-family: 'Press Start 2P', 'Courier New', monospace;
  color: #e8e8e8;
  z-index: 40;
  user-select: none;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 36px;
  background: rgba(20, 20, 25, 0.92);
  border: 2px solid #5a5a5a;
  box-shadow:
    inset 2px 2px 0 #3a3a44,
    inset -2px -2px 0 #000,
    0 0 0 4px #000;
}

.panel-title {
  margin: 0;
  font-size: 22px;
  letter-spacing: 3px;
  color: #f4f4f4;
  text-shadow: 2px 2px 0 #2a2a2a;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 220px;
}

.btn {
  padding: 11px 14px;
  font-family: inherit;
  font-size: 12px;
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
.btn:hover {
  background: #5a5a6a;
}
.btn:active {
  box-shadow:
    inset 2px 2px 0 #2a2a34,
    inset -2px -2px 0 #6a6a7a;
  transform: translate(1px, 1px);
}
.btn-danger {
  background: #5a3a3a;
}
.btn-danger:hover {
  background: #6a4a4a;
}

.settings-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #5a5a5a;
}
.setting-label {
  font-size: 10px;
  color: #b8b8c0;
}
.slider {
  width: 180px;
  accent-color: #7fff7f;
}
</style>
