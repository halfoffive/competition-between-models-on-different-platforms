<script setup lang="ts">
const emit = defineEmits<{
  (e: 'resume'): void
  (e: 'save'): void
  (e: 'quit'): void
}>()
</script>

<template>
  <div class="pause-overlay">
    <div class="pause-panel">
      <h2>游戏菜单</h2>
      <button class="btn" @click="emit('resume')">返回游戏</button>
      <button class="btn" @click="emit('save')">保存世界</button>
      <button class="btn danger" @click="emit('quit')">退出至主菜单</button>
    </div>
  </div>
</template>

<style scoped>
.pause-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  backdrop-filter: blur(4px);
}
.pause-panel {
  background: rgba(20, 22, 40, 0.95);
  border: 1px solid rgba(150, 160, 230, 0.3);
  border-radius: 8px;
  padding: 24px 32px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #e4e6ff;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
h2 {
  margin: 0 0 8px;
  text-align: center;
  color: #b0b8ff;
}
.btn {
  background: rgba(60, 70, 120, 0.4);
  border: 1px solid rgba(150, 160, 230, 0.3);
  color: #e4e6ff;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.1s;
}
.btn:hover { background: rgba(80, 100, 200, 0.4); }
.btn.danger { color: #ff8080; }
.btn.danger:hover { background: rgba(180, 60, 60, 0.3); }
</style>
