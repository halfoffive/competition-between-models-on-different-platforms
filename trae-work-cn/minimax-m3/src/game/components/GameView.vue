<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '../stores/game'
import { Game } from '@/engine/Game'
import { World } from '@/engine/world/World'
import { BlockId } from '@/engine/world/BlockId'
import { registry } from '@/engine/world/BlockRegistry'
import { findRecipe, furnaceRecipes, fuelTicks, isPickaxe, toolTier, attackDamage } from '@/engine/crafting/Recipes'
import { mobTypes, MobManager } from '@/engine/mob/Mob'

import Hotbar from './Hotbar.vue'
import Crosshair from './Crosshair.vue'
import DebugOverlay from './DebugOverlay.vue'
import InventoryScreen from './InventoryScreen.vue'
import PauseMenu from './PauseMenu.vue'
import DeathScreen from './DeathScreen.vue'
import CraftingTableScreen from './CraftingTableScreen.vue'
import MainMenu from './MainMenu.vue'
import Toasts from './Toasts.vue'
import StatusBar from './StatusBar.vue'

const store = useGameStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const wrapRef = ref<HTMLDivElement | null>(null)
let game: Game | null = null
let rafId = 0

const keyState = ref<Record<string, boolean>>({})

function updateInput() {
  if (!game) return
  const input = {
    forward: !!keyState.value['KeyW'] || !!keyState.value['ArrowUp'],
    back: !!keyState.value['KeyS'] || !!keyState.value['ArrowDown'],
    left: !!keyState.value['KeyA'] || !!keyState.value['ArrowLeft'],
    right: !!keyState.value['KeyD'] || !!keyState.value['ArrowRight'],
    jump: !!keyState.value['Space'],
    sneak: !!keyState.value['ShiftLeft'] || !!keyState.value['ShiftRight'],
    sprint: !!keyState.value['ControlLeft'] || !!keyState.value['ControlRight'],
  }
  game.setInput(input)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.repeat) return
  if (e.code === 'Escape') {
    if (game) {
      if (store.ui.showInventory || store.ui.showCraftingTable) {
        store.ui.showInventory = false
        store.ui.showCraftingTable = false
      } else {
        store.ui.showPauseMenu = !store.ui.showPauseMenu
      }
    }
    e.preventDefault()
    return
  }
  if (e.code === 'KeyE') {
    if (game) game.toggleInventory()
    e.preventDefault()
    return
  }
  if (e.code === 'F3') {
    if (game) game.toggleDebug()
    e.preventDefault()
    return
  }
  if (e.code === 'F4') {
    if (game) game.toggleMode()
    e.preventDefault()
    return
  }
  if (e.code === 'KeyF') {
    if (game && store.mode === 'creative') game.toggleFly()
    e.preventDefault()
    return
  }
  if (e.code === 'KeyR') {
    if (game && store.ui.showDeath) game.respawn()
    e.preventDefault()
    return
  }
  // 热栏 1-9
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10)
    if (n >= 1 && n <= 9) {
      if (game) game.selectSlot(n - 1)
      e.preventDefault()
      return
    }
  }
  keyState.value[e.code] = true
  updateInput()
}

function onKeyUp(e: KeyboardEvent) {
  keyState.value[e.code] = false
  updateInput()
}

function onMouseMove(e: MouseEvent) {
  if (!game || !game.pointerLocked) return
  if (store.ui.showInventory || store.ui.showCraftingTable || store.ui.showPauseMenu || store.ui.showDeath) return
  const sens = 0.002
  game.rotate(e.movementX * sens, e.movementY * sens)
}

function onMouseDown(e: MouseEvent) {
  if (!game) return
  if (e.button === 0) game.setMouseLeft(true)
  if (e.button === 2) game.setMouseRight(true)
  if (e.button === 1) {
    // 中键选择 hotbar 上对应方块
    if (store.selectedBlock) {
      const id = store.selectedBlock.id
      const blockProps = registry.get(id as BlockId)
      if (blockProps.stackable) {
        // 简化：直接给玩家一个
        const stack = { id, count: 1 }
        game.player.giveItem(stack)
        store.pushToast(`+ ${blockProps.name}`)
      }
    }
  }
}

function onMouseUp(e: MouseEvent) {
  if (!game) return
  if (e.button === 0) game.setMouseLeft(false)
}

function onContextMenu(e: MouseEvent) {
  e.preventDefault()
}

function onPointerLockChange() {
  if (!game) return
  game.pointerLocked = document.pointerLockElement === canvasRef.value
}

function requestPointerLock() {
  const c = canvasRef.value
  if (!c) return
  c.requestPointerLock?.()
}

function startGame() {
  if (!canvasRef.value) return
  const seedNum = parseInt(store.seed, 10) || hashSeed(store.seed)
  const world = new World(seedNum)
  game = new Game(canvasRef.value, world)
  game.player.setMode(store.mode)
  game.mobs.difficulty = store.difficulty
  game.start()
  store.setInGame(true)
  store.setShowMainMenu(false)
  // 初始物品栏：一些木头和木板
  game.player.giveItem({ id: BlockId.OAK_PLANKS, count: 16 })
  game.player.giveItem({ id: BlockId.OAK_LOG, count: 4 })
  game.player.giveItem({ id: BlockId.STICK, count: 8 })
  game.player.giveItem({ id: BlockId.WOODEN_PICKAXE, count: 1 })
  game.player.giveItem({ id: BlockId.WOODEN_SWORD, count: 1 })
  game.player.giveItem({ id: BlockId.WOODEN_SHOVEL, count: 1 })
  game.player.giveItem({ id: BlockId.WOODEN_AXE, count: 1 })

  game.onTick = (dt, fps) => {
    // 同步到 store
    const p = game!.player
    store.yaw = p.yaw
    store.pitch = p.pitch
    store.position = { x: p.position.x, y: p.position.y, z: p.position.z }
    store.health = p.health
    store.hunger = p.hunger
    store.oxygen = p.oxygen
    store.hotbarSlot = p.hotbarSlot
    store.inventory = p.inventory.map(s => s ? { id: s.id, count: s.count } : null)
    store.ui = {
      showInventory: game!.ui.showInventory,
      showDebug: game!.ui.showDebug,
      showPauseMenu: game!.ui.showPauseMenu,
      showCraftingTable: game!.ui.showCraftingTable,
      showFurnace: !!game!.ui.showFurnace,
      showDeath: game!.ui.showDeath,
    }
    store.timeOfDay = game!.renderer.worldTime
    store.fps = fps
    store.chunkCount = game!.world.chunks.size
    // 选中方块
    store.selectedBlock = game!.ui.selectedBlock
  }

  game.onPlayerDeath = () => {
    store.ui.showDeath = true
  }

  // 加载存档
  const saved = localStorage.getItem('voxelcraft_save')
  if (saved) {
    try {
      game.loadFromSave(saved)
    } catch (err) {
      console.error('Failed to load save', err)
    }
  }
}

function hashSeed(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) * 16777619 >>> 0
  }
  return h
}

function saveGame() {
  if (!game) return
  try {
    const data = game.serialize()
    localStorage.setItem('voxelcraft_save', data)
    store.pushToast('世界已保存')
  } catch (err) {
    console.error('Failed to save', err)
    store.pushToast('保存失败')
  }
}

function backToMenu() {
  if (game) {
    saveGame()
    game.stop()
  }
  game = null
  store.setInGame(false)
  store.setShowMainMenu(true)
  store.ui.showPauseMenu = false
  store.ui.showInventory = false
}

function onResize() {
  if (!canvasRef.value || !game) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvasRef.value.width = w
  canvasRef.value.height = h
  game.renderer.resize(w, h)
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('pointerlockchange', onPointerLockChange)
  canvasRef.value?.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mouseup', onMouseUp)
  canvasRef.value?.addEventListener('contextmenu', onContextMenu)
  canvasRef.value?.addEventListener('click', requestPointerLock)
  window.addEventListener('resize', onResize)
  onResize()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('pointerlockchange', onPointerLockChange)
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('resize', onResize)
  if (game) game.stop()
})
</script>

<template>
  <div ref="wrapRef" class="game-container">
    <canvas ref="canvasRef" id="game-canvas"></canvas>

    <template v-if="store.inGame">
      <Crosshair />
      <Hotbar />
      <StatusBar />
      <DebugOverlay v-if="store.ui.showDebug" />
      <InventoryScreen
        v-if="store.ui.showInventory"
        @close="game && game.toggleInventory()"
      />
      <CraftingTableScreen
        v-if="store.ui.showCraftingTable"
        @close="store.ui.showCraftingTable = false"
      />
      <PauseMenu
        v-if="store.ui.showPauseMenu"
        @resume="store.ui.showPauseMenu = false"
        @save="saveGame"
        @quit="backToMenu"
      />
      <DeathScreen
        v-if="store.ui.showDeath"
        @respawn="game && game.respawn()"
      />
      <Toasts />
    </template>

    <MainMenu
      v-if="store.showMainMenu"
      @start="startGame"
    />
  </div>
</template>

<style scoped>
.game-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>
