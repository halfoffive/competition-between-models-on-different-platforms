<template>
  <div class="game-container">
    <canvas ref="canvasRef" class="game-canvas" @click="handleCanvasClick"></canvas>

    <div class="crosshair" v-show="pointerLocked && !paused">
      <div class="crosshair-h"></div>
      <div class="crosshair-v"></div>
    </div>

    <div class="start-screen" v-show="gameState === 'start'">
      <div class="start-screen-content">
        <div class="game-title">
          <span class="title-pixel">VoxelCraft</span>
          <span class="title-sub">体素沙盒</span>
        </div>
        <div class="game-subtitle">在浏览器中建造你的世界</div>
        <button class="pixel-btn primary" @click="startGame">开始游戏</button>
        <div class="controls-card">
          <div class="controls-title">操作说明</div>
          <div class="controls-grid">
            <div class="control-item"><span class="key">WASD</span><span class="desc">移动</span></div>
            <div class="control-item"><span class="key">鼠标</span><span class="desc">视角</span></div>
            <div class="control-item"><span class="key">左键</span><span class="desc">破坏</span></div>
            <div class="control-item"><span class="key">右键</span><span class="desc">放置</span></div>
            <div class="control-item"><span class="key">空格</span><span class="desc">跳跃</span></div>
            <div class="control-item"><span class="key">双击空格</span><span class="desc">飞行</span></div>
            <div class="control-item"><span class="key">1-9</span><span class="desc">选择方块</span></div>
            <div class="control-item"><span class="key">滚轮</span><span class="desc">切换物品</span></div>
            <div class="control-item"><span class="key">T</span><span class="desc">时间速度</span></div>
            <div class="control-item"><span class="key">F3</span><span class="desc">调试</span></div>
            <div class="control-item"><span class="key">ESC</span><span class="desc">暂停</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="pause-menu" v-show="paused">
      <div class="pause-overlay"></div>
      <div class="pause-panel">
        <div class="pause-title">游戏暂停</div>
        <button class="pixel-btn primary" @click="resumeGame">继续游戏</button>
        <button class="pixel-btn" @click="regenerateWorld">重新生成世界</button>
        <button class="pixel-btn" @click="backToMenu">返回主菜单</button>
        <div class="pause-controls-hint">按 ESC 继续游戏</div>
      </div>
    </div>

    <div class="debug-panel" v-show="showDebug && pointerLocked">
      <div class="debug-item">FPS: {{ fps }}</div>
      <div class="debug-item">位置: {{ posX.toFixed(1) }}, {{ posY.toFixed(1) }}, {{ posZ.toFixed(1) }}</div>
      <div class="debug-item">选中: {{ selectedBlockName }}</div>
      <div class="debug-item" v-if="targetBlockInfo">目标: {{ targetBlockInfo }}</div>
      <div class="debug-item">模式: {{ flying ? '飞行' : '生存' }}</div>
      <div class="debug-item">时间: {{ timeOfDayName }} ({{ (dayTime * 100).toFixed(0) }}%)</div>
      <div class="debug-item">速度: {{ timeSpeed }}x</div>
    </div>

    <div class="hotbar" v-show="pointerLocked && !paused">
      <div
        v-for="(block, index) in hotbarBlocks"
        :key="index"
        class="hotbar-slot"
        :class="{ active: index === selectedHotbarIndex }"
      >
        <div class="hotbar-num">{{ index + 1 }}</div>
        <div class="hotbar-block" :style="{ background: getBlockColor(block) }"></div>
      </div>
    </div>

    <div class="controls-hint" v-show="pointerLocked && !paused">
      WASD 移动 · 空格跳跃/飞行上升 · Shift 冲刺/飞行下降 · 左键破坏 · 右键放置 · 滚轮/1-9 选择 · T 时间速度 · F3 调试 · ESC 暂停
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Renderer } from './game/renderer.js'
import { World } from './game/world.js'
import { TerrainGenerator } from './game/terrain.js'
import { Player } from './game/player.js'
import { InteractionSystem } from './game/interaction.js'
import { DayNightCycle } from './game/dayNight.js'
import { HotbarBlocks, BlockNames, BlockType } from './game/blocks.js'

const canvasRef = ref(null)
let renderer = null
let world = null
let player = null
let interaction = null
let dayNightCycle = null
let animationId = null
let lastTime = 0
let frameCount = 0
let fpsTime = 0
let worldSeed = 42

const gameState = ref('start')
const paused = ref(false)
const pointerLocked = ref(false)
const showDebug = ref(false)
const fps = ref(0)
const posX = ref(0)
const posY = ref(0)
const posZ = ref(0)
const flying = ref(false)
const selectedHotbarIndex = ref(0)
const hotbarBlocks = ref(HotbarBlocks)
const targetBlockInfo = ref('')
const dayTime = ref(0.25)
const timeOfDayName = ref('白天')
const timeSpeed = ref(1)

const timeSpeedLevels = [0, 0.5, 1, 2, 5]
let currentSpeedIndex = 2

const keys = reactive({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false
})

const selectedBlockName = ref('')

function updateSelectedBlockName() {
  const blockType = hotbarBlocks.value[selectedHotbarIndex.value]
  selectedBlockName.value = BlockNames[blockType] || '未知'
}

function getBlockColor(blockType) {
  const colors = {
    [BlockType.GRASS]: '#4caf50',
    [BlockType.DIRT]: '#8b5e3c',
    [BlockType.STONE]: '#9e9e9e',
    [BlockType.WOOD]: '#6d4c2e',
    [BlockType.LEAVES]: '#2e7d32',
    [BlockType.SAND]: '#e8d48a',
    [BlockType.BRICK]: '#c62828',
    [BlockType.GLASS]: '#bbdefb',
    [BlockType.CACTUS]: '#2e7d32'
  }
  return colors[blockType] || '#888'
}

function handleWheel(e) {
  if (!pointerLocked.value || paused.value) return
  e.preventDefault()
  if (e.deltaY > 0) {
    selectedHotbarIndex.value = (selectedHotbarIndex.value + 1) % hotbarBlocks.value.length
  } else {
    selectedHotbarIndex.value = (selectedHotbarIndex.value - 1 + hotbarBlocks.value.length) % hotbarBlocks.value.length
  }
  updateSelectedBlockName()
}

function handleKeyDown(e) {
  if (gameState.value !== 'playing') return

  switch (e.code) {
    case 'KeyW': keys.forward = true; break
    case 'KeyS': keys.backward = true; break
    case 'KeyA': keys.left = true; break
    case 'KeyD': keys.right = true; break
    case 'Space': keys.jump = true; break
    case 'ShiftLeft':
    case 'ShiftRight': keys.sprint = true; break
    case 'F3':
      e.preventDefault()
      showDebug.value = !showDebug.value
      break
    case 'KeyT':
      e.preventDefault()
      currentSpeedIndex = (currentSpeedIndex + 1) % timeSpeedLevels.length
      timeSpeed.value = timeSpeedLevels[currentSpeedIndex]
      if (dayNightCycle) {
        dayNightCycle.setTimeSpeed(timeSpeed.value)
      }
      break
    case 'Escape':
      if (paused.value) {
        resumeGame()
      } else if (pointerLocked.value) {
        pauseGame()
      }
      break
    case 'Digit1': selectedHotbarIndex.value = 0; updateSelectedBlockName(); break
    case 'Digit2': selectedHotbarIndex.value = 1; updateSelectedBlockName(); break
    case 'Digit3': selectedHotbarIndex.value = 2; updateSelectedBlockName(); break
    case 'Digit4': selectedHotbarIndex.value = 3; updateSelectedBlockName(); break
    case 'Digit5': selectedHotbarIndex.value = 4; updateSelectedBlockName(); break
    case 'Digit6': selectedHotbarIndex.value = 5; updateSelectedBlockName(); break
    case 'Digit7': selectedHotbarIndex.value = 6; updateSelectedBlockName(); break
    case 'Digit8': selectedHotbarIndex.value = 7; updateSelectedBlockName(); break
    case 'Digit9': selectedHotbarIndex.value = 8; updateSelectedBlockName(); break
  }
}

function handleKeyUp(e) {
  switch (e.code) {
    case 'KeyW': keys.forward = false; break
    case 'KeyS': keys.backward = false; break
    case 'KeyA': keys.left = false; break
    case 'KeyD': keys.right = false; break
    case 'Space': keys.jump = false; break
    case 'ShiftLeft':
    case 'ShiftRight': keys.sprint = false; break
  }
}

function handleMouseMove(e) {
  if (!pointerLocked.value || !player || paused.value) return
  player.addRotation(e.movementX, e.movementY)
}

function handleMouseDown(e) {
  if (!pointerLocked.value || !interaction || paused.value) return

  if (e.button === 0) {
    interaction.breakBlock()
  } else if (e.button === 2) {
    const blockType = hotbarBlocks.value[selectedHotbarIndex.value]
    interaction.placeBlock(blockType)
  }
}

function handleContextMenu(e) {
  e.preventDefault()
}

function handlePointerLockChange() {
  pointerLocked.value = document.pointerLockElement === canvasRef.value
  if (!pointerLocked.value && gameState.value === 'playing' && !paused.value) {
    pauseGame()
  }
}

function handleCanvasClick() {
  if (gameState.value === 'start') {
    return
  }
  if (!pointerLocked.value && canvasRef.value && !paused.value) {
    canvasRef.value.requestPointerLock()
  }
}

function initGame() {
  renderer = new Renderer(canvasRef.value)
  renderer.init()

  dayNightCycle = new DayNightCycle({ startTime: 0.25, dayLength: 600 })

  generateWorld()

  player = new Player()
  player.spawnAtSurface(world)

  interaction = new InteractionSystem(world, renderer, player)

  updateSelectedBlockName()
}

function generateWorld() {
  world = new World(64, 32, 64)
  const terrainGen = new TerrainGenerator(worldSeed)
  terrainGen.generate(world)
  renderer.renderWorld(world)

  if (player) {
    player.spawnAtSurface(world)
  }
}

function startGame() {
  gameState.value = 'playing'
  if (!renderer) {
    initGame()
  }
  if (canvasRef.value) {
    canvasRef.value.requestPointerLock()
  }
}

function pauseGame() {
  paused.value = true
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

function resumeGame() {
  paused.value = false
  if (canvasRef.value) {
    canvasRef.value.requestPointerLock()
  }
}

function regenerateWorld() {
  worldSeed = Math.floor(Math.random() * 100000)
  generateWorld()
  resumeGame()
}

function backToMenu() {
  paused.value = false
  gameState.value = 'start'
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

function gameLoop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.1)
  lastTime = time

  frameCount++
  if (time - fpsTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    fpsTime = time
  }

  if (gameState.value === 'playing' && !paused.value && player && renderer && world) {
    if (dayNightCycle) {
      dayNightCycle.update(delta)
      dayTime.value = dayNightCycle.dayTime
      timeOfDayName.value = dayNightCycle.getTimeOfDayName()

      const sunPos = dayNightCycle.getSunPosition()
      renderer.setSunPosition(sunPos)
      renderer.setSkyColor(dayNightCycle.getSkyColor())
      renderer.setAmbientIntensity(dayNightCycle.getAmbientIntensity())
      renderer.setFog(dayNightCycle.getFogColor(), dayNightCycle.getFogDensity())
    }

    player.update(delta, world, keys)
    player.applyRotation(renderer.camera)

    if (interaction) {
      interaction.update()
      if (interaction.targetBlock) {
        const { x, y, z } = interaction.targetBlock
        const block = world.getBlock(x, y, z)
        targetBlockInfo.value = `${BlockNames[block] || '未知'} (${x}, ${y}, ${z})`
      } else {
        targetBlockInfo.value = ''
      }
    }

    posX.value = player.position.x
    posY.value = player.position.y
    posZ.value = player.position.z
    flying.value = player.flying

    renderer.render()
  } else if (renderer) {
    renderer.render()
  }

  animationId = requestAnimationFrame(gameLoop)
}

onMounted(() => {
  if (canvasRef.value) {
    initGame()
  }
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('contextmenu', handleContextMenu)
  window.addEventListener('wheel', handleWheel, { passive: false })
  document.addEventListener('pointerlockchange', handlePointerLockChange)
  animationId = requestAnimationFrame(gameLoop)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('contextmenu', handleContextMenu)
  window.removeEventListener('wheel', handleWheel)
  document.removeEventListener('pointerlockchange', handlePointerLockChange)
  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
  renderer?.dispose()
})
</script>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #1a1a2e;
  font-family: 'Courier New', Courier, monospace;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
  image-rendering: pixelated;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  width: 20px;
  height: 20px;
  z-index: 10;
}

.crosshair-h {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background: white;
  transform: translateY(-50%);
  box-shadow: 2px 0 0 rgba(0, 0, 0, 0.8), -2px 0 0 rgba(0, 0, 0, 0.8);
}

.crosshair-v {
  position: absolute;
  top: 0;
  left: 50%;
  width: 2px;
  height: 100%;
  background: white;
  transform: translateX(-50%);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.8), 0 -2px 0 rgba(0, 0, 0, 0.8);
}

.start-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #1a1a3e 0%, #2d2d5a 50%, #3d3d7a 100%);
  z-index: 100;
}

.start-screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.start-screen-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.game-title {
  margin-bottom: 8px;
}

.title-pixel {
  display: block;
  font-size: 64px;
  font-weight: bold;
  color: #fff;
  text-shadow:
    4px 4px 0 #2e7d32,
    8px 8px 0 rgba(0, 0, 0, 0.3);
  letter-spacing: 4px;
  margin-bottom: 4px;
  font-family: 'Courier New', Courier, monospace;
}

.title-sub {
  display: block;
  font-size: 32px;
  color: #a5d6a7;
  text-shadow: 2px 2px 0 #1b5e20;
  letter-spacing: 8px;
  font-family: 'Courier New', Courier, monospace;
}

.game-subtitle {
  font-size: 16px;
  color: #b0bec5;
  margin-bottom: 40px;
  letter-spacing: 2px;
}

.pixel-btn {
  display: block;
  width: 240px;
  margin: 0 auto 16px;
  padding: 14px 24px;
  font-size: 16px;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  color: #fff;
  background: #5d4037;
  border: 3px solid #3e2723;
  border-radius: 0;
  cursor: pointer;
  position: relative;
  box-shadow:
    inset -3px -3px 0 rgba(0, 0, 0, 0.3),
    inset 3px 3px 0 rgba(255, 255, 255, 0.1);
  transition: transform 0.05s;
  letter-spacing: 2px;
}

.pixel-btn:hover {
  background: #6d4c41;
}

.pixel-btn:active {
  transform: translate(2px, 2px);
  box-shadow:
    inset 3px 3px 0 rgba(0, 0, 0, 0.3),
    inset -3px -3px 0 rgba(255, 255, 255, 0.1);
}

.pixel-btn.primary {
  background: #2e7d32;
  border-color: #1b5e20;
}

.pixel-btn.primary:hover {
  background: #388e3c;
}

.controls-card {
  margin-top: 40px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.6);
  border: 3px solid #5d4037;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.controls-title {
  font-size: 18px;
  font-weight: bold;
  color: #ffd54f;
  margin-bottom: 16px;
  letter-spacing: 4px;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.5);
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 24px;
  text-align: left;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.control-item .key {
  display: inline-block;
  min-width: 70px;
  padding: 4px 8px;
  background: #37474f;
  border: 2px solid #263238;
  color: #fff;
  font-size: 11px;
  text-align: center;
  font-weight: bold;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.1);
}

.control-item .desc {
  color: #cfd8dc;
}

.pause-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
}

.pause-panel {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px 48px;
  background: rgba(26, 26, 46, 0.95);
  border: 4px solid #5d4037;
  box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
}

.pause-title {
  font-size: 36px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 32px;
  letter-spacing: 8px;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', Courier, monospace;
}

.pause-controls-hint {
  margin-top: 24px;
  font-size: 12px;
  color: #78909c;
  letter-spacing: 2px;
}

.debug-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #00ff00;
  padding: 12px 16px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  border: 2px solid #00ff00;
  pointer-events: none;
  user-select: none;
  z-index: 20;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
  line-height: 1.6;
}

.debug-item {
  margin-bottom: 2px;
  white-space: nowrap;
}

.debug-item:last-child {
  margin-bottom: 0;
}

.hotbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.6);
  border: 3px solid #3e2723;
  pointer-events: none;
  user-select: none;
  z-index: 15;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.5);
}

.hotbar-slot {
  position: relative;
  width: 48px;
  height: 48px;
  background: #8b8b8b;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.2);
}

.hotbar-slot.active {
  border-color: #fff;
  background: #a0a0a0;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.3),
    0 0 0 2px #fff,
    0 0 8px rgba(255, 255, 255, 0.5);
  transform: translateY(-4px);
}

.hotbar-num {
  position: absolute;
  top: 2px;
  left: 4px;
  font-size: 10px;
  color: white;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.8);
  z-index: 1;
}

.hotbar-block {
  width: 32px;
  height: 32px;
  box-shadow:
    inset -2px -2px 0 rgba(0, 0, 0, 0.3),
    inset 2px 2px 0 rgba(255, 255, 255, 0.2);
  image-rendering: pixelated;
}

.controls-hint {
  position: absolute;
  bottom: 88px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 11px;
  font-family: 'Courier New', Courier, monospace;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.8);
  pointer-events: none;
  user-select: none;
  opacity: 0.6;
  z-index: 15;
  white-space: nowrap;
  letter-spacing: 1px;
}
</style>
