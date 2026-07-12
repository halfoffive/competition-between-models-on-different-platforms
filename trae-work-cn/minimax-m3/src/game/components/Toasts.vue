<script setup lang="ts">
import { useGameStore } from '../stores/game'
const store = useGameStore()
</script>

<template>
  <div class="toasts">
    <div v-for="t in store.toasts" :key="t.id" class="toast">
      {{ t.text }}
    </div>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, calc(-50% - 80px));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 100;
  pointer-events: none;
}
.toast {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  animation: fadein 0.2s ease-out;
  white-space: nowrap;
}
@keyframes fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
