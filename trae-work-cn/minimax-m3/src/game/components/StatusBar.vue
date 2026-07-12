<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/game'

const store = useGameStore()

const healthIcons = computed(() => {
  const out: { filled: boolean; half: boolean }[] = []
  for (let i = 0; i < 10; i++) {
    const v = store.health - i * 2
    out.push({ filled: v >= 2, half: v === 1 })
  }
  return out
})
const hungerIcons = computed(() => {
  const out: { filled: boolean; half: boolean }[] = []
  for (let i = 0; i < 10; i++) {
    const v = store.hunger - i * 2
    out.push({ filled: v >= 2, half: v === 1 })
  }
  return out
})
const oxygenIcons = computed(() => {
  if (store.oxygen >= 19) return []
  const out: { filled: boolean }[] = []
  for (let i = 0; i < 10; i++) {
    out.push({ filled: store.oxygen > i * 2 })
  }
  return out
})
</script>

<template>
  <div class="status">
    <div class="bar health" v-if="store.mode === 'survival'">
      <span v-for="(h, i) in healthIcons" :key="i" class="heart" :class="{ filled: h.filled, half: h.half }">♥</span>
    </div>
    <div class="bar hunger" v-if="store.mode === 'survival'">
      <span v-for="(h, i) in hungerIcons" :key="i" class="drumstick" :class="{ filled: h.filled, half: h.half }">🍖</span>
    </div>
    <div class="bar oxygen" v-if="oxygenIcons.length > 0">
      <span v-for="(h, i) in oxygenIcons" :key="i" class="bubble" :class="{ filled: h.filled }">○</span>
    </div>
  </div>
</template>

<style scoped>
.status {
  position: fixed;
  bottom: 84px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 9;
  pointer-events: none;
}
.bar {
  display: flex;
  gap: 0;
}
.heart, .drumstick, .bubble {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
  text-shadow: 1px 1px 0 #000;
  filter: grayscale(1) brightness(0.6);
  margin: 0 -1px;
}
.heart.filled {
  color: #ff3030;
  filter: none;
  text-shadow: 0 0 4px rgba(255, 0, 0, 0.5);
}
.heart.half {
  background: linear-gradient(90deg, #ff3030 50%, rgba(0, 0, 0, 0.6) 50%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: none;
}
.drumstick.filled {
  color: #c08030;
  filter: drop-shadow(0 0 4px rgba(180, 100, 30, 0.5));
}
.drumstick.half {
  background: linear-gradient(90deg, #c08030 50%, rgba(0, 0, 0, 0.6) 50%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: none;
}
.bubble.filled {
  color: #6cf;
  filter: drop-shadow(0 0 4px rgba(100, 200, 255, 0.5));
}
</style>
