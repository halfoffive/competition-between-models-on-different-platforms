<script setup lang="ts">
const emit = defineEmits<{ (e: 'respawn'): void }>()
</script>

<template>
  <div class="death-overlay">
    <div class="death-panel">
      <h1>你死了！</h1>
      <p>生命值归零。</p>
      <button class="btn" @click="emit('respawn')">重生 (R)</button>
    </div>
  </div>
</template>

<style scoped>
.death-overlay {
  position: fixed;
  inset: 0;
  background: rgba(80, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 70;
  backdrop-filter: blur(4px);
}
.death-panel {
  background: rgba(20, 5, 5, 0.95);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  padding: 32px 40px;
  text-align: center;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}
h1 {
  margin: 0 0 12px;
  font-size: 32px;
  color: #ff8888;
  text-shadow: 0 2px 8px rgba(255, 0, 0, 0.4);
}
p {
  margin: 0 0 20px;
  color: #ffaaaa;
}
.btn {
  background: linear-gradient(135deg, #d04040 0%, #a02020 100%);
  border: none;
  color: #fff;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(180, 40, 40, 0.4);
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(180, 40, 40, 0.5);
}
</style>
