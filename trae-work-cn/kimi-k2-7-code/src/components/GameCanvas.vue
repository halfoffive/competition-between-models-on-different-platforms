<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  Fog,
  DirectionalLight,
  AmbientLight,
} from 'three'
import { World } from '@/world/World'
import { WorldRenderer } from '@/world/WorldRenderer'
import { FirstPersonController } from '@/player/FirstPersonController'
import { BlockInteraction } from '@/player/BlockInteraction'
import { DayNightCycle } from '@/world/DayNightCycle'
import { SaveManager } from '@/save/SaveManager'
import { gameState } from '@/stores/gameState'

const canvasContainer = ref<HTMLDivElement | null>(null)
const isLocked = computed(() => gameState.locked)

let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let renderer: WebGLRenderer | null = null
let world: World | null = null
let worldRenderer: WorldRenderer | null = null
let controller: FirstPersonController | null = null
let blockInteraction: BlockInteraction | null = null
let dayNightCycle: DayNightCycle | null = null
let saveManager: SaveManager | null = null

let rafId = 0
let isActive = true
let lastFrameTime = 0

function init() {
  const container = canvasContainer.value
  if (!container) return

  scene = new Scene()
  scene.background = new Color(0x87ceeb)
  const fog = new Fog(0x87ceeb, 32, 192)
  scene.fog = fog

  camera = new PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  )

  renderer = new WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  container.appendChild(renderer.domElement)

  const ambient = new AmbientLight(0xffffff, 0.6)
  scene.add(ambient)

  const sun = new DirectionalLight(0xffffff, 0.8)
  sun.position.set(50, 100, 50)
  sun.castShadow = true
  sun.shadow.mapSize.width = 2048
  sun.shadow.mapSize.height = 2048
  scene.add(sun)

  world = new World(12345)

  controller = new FirstPersonController(camera, renderer.domElement, world)
  controller.setPosition(0, 120, 0)

  worldRenderer = new WorldRenderer(scene, world)
  worldRenderer.setRenderDistance(8)

  dayNightCycle = new DayNightCycle(scene, sun, ambient, fog)

  blockInteraction = new BlockInteraction(
    camera,
    worldRenderer,
    scene,
    controller,
    renderer.domElement,
    onBlockModified,
  )

  saveManager = new SaveManager(world, worldRenderer, controller, dayNightCycle)
  const loaded = saveManager.start()

  if (!loaded) {
    world.generateChunk(0, 0)
    const height = world.getTerrainHeight(0, 0)
    controller.setPosition(0, height + 2, 0)
    controller.setRotation(0, 0)
  }

  if (camera && worldRenderer) {
    worldRenderer.update(camera.position.x, camera.position.z)
  }

  window.addEventListener('resize', onResize)
  lastFrameTime = performance.now()
  animate()
}

function onResize() {
  const container = canvasContainer.value
  if (!container || !camera || !renderer) return
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

function animate() {
  if (!isActive) return
  rafId = requestAnimationFrame(animate)

  const now = performance.now()
  const dt = Math.min((now - lastFrameTime) / 1000, 0.1)
  lastFrameTime = now

  controller?.update(dt)
  dayNightCycle?.update(dt)
  blockInteraction?.update()

  if (worldRenderer && camera) {
    worldRenderer.update(camera.position.x, camera.position.z)
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
}

function onBlockModified() {
  saveManager?.markModified()
}

function dispose() {
  isActive = false
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', onResize)

  saveManager?.stop()
  saveManager = null

  blockInteraction?.dispose()
  blockInteraction = null

  controller?.dispose()
  controller = null

  dayNightCycle?.dispose()
  dayNightCycle = null

  worldRenderer?.dispose()
  worldRenderer = null
  world = null

  if (renderer) {
    renderer.dispose()
    const container = canvasContainer.value
    if (container && renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement)
    }
  }
  scene = null
  camera = null
  renderer = null
}

onMounted(init)
onUnmounted(dispose)
</script>

<template>
  <div ref="canvasContainer" class="game-canvas" />
  <div v-if="!isLocked" class="lock-hint">
    <div class="lock-hint-box">点击画面进入游戏</div>
  </div>
</template>

<style scoped>
.game-canvas {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.lock-hint {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.lock-hint-box {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 16px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}
</style>
