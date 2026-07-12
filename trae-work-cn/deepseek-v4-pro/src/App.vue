<template>
  <GameCanvas ref="gameCanvasRef" @hotbar-change="onHotbarChange" @hotbar-select="onHotbarSelect" />
  <Hotbar ref="hotbarRef" @select="onBlockSelect" />
</template>

<script setup>
import { ref } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import Hotbar from './components/Hotbar.vue'

const gameCanvasRef = ref(null)
const hotbarRef = ref(null)

function onHotbarChange(delta) {
  hotbarRef.value?.switchByDelta(delta)
}

function onHotbarSelect(index) {
  hotbarRef.value?.switchByDigit(index)
}

function onBlockSelect(type) {
  gameCanvasRef.value?.setBlockType(type)
}
</script>