<script setup lang="ts">
import { onMounted } from 'vue'
import GameView from './game/components/GameView.vue'
import { useGameStore } from './game/stores/game'

const store = useGameStore()

onMounted(() => {
  store.setShowMainMenu(true)
})
</script>

<template>
  <GameView />
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  user-select: none;
  -webkit-user-select: none;
}
#boot {
  display: none !important;
}
</style>
