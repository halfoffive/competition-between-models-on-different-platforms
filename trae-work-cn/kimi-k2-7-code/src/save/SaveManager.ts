import { World } from '@/world/World'
import { WorldRenderer } from '@/world/WorldRenderer'
import { gameState, setSelectedIndex } from '@/stores/gameState'
import type { FirstPersonController } from '@/player/FirstPersonController'
import type { DayNightCycle } from '@/world/DayNightCycle'
import { BlockType } from '@/blocks/BlockType'
import { worldToChunk, CHUNK_SIZE } from '@/world/Chunk'

const SAVE_KEY = 'voxel-world-save'
const AUTO_SAVE_INTERVAL = 10000
const DEBOUNCE_DELAY = 2000

interface PlayerSaveData {
  x: number
  y: number
  z: number
  yaw: number
  pitch: number
}

interface SaveData {
  seed: number
  player: PlayerSaveData
  selectedIndex: number
  time: number
  modifiedBlocks: [string, BlockType][]
}

export class SaveManager {
  private world: World
  private worldRenderer: WorldRenderer
  private controller: FirstPersonController
  private dayNightCycle: DayNightCycle

  private autoSaveTimer: ReturnType<typeof setInterval> | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    world: World,
    worldRenderer: WorldRenderer,
    controller: FirstPersonController,
    dayNightCycle: DayNightCycle,
  ) {
    this.world = world
    this.worldRenderer = worldRenderer
    this.controller = controller
    this.dayNightCycle = dayNightCycle
  }

  start(): boolean {
    const loaded = this.load()
    this.autoSaveTimer = setInterval(() => this.save(), AUTO_SAVE_INTERVAL)
    return loaded
  }

  stop(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  markModified(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => this.save(), DEBOUNCE_DELAY)
  }

  save(): void {
    const data: SaveData = {
      seed: this.world.getSeed(),
      player: {
        x: this.controller.getPosition().x,
        y: this.controller.getPosition().y,
        z: this.controller.getPosition().z,
        yaw: this.controller.getYaw(),
        pitch: this.controller.getPitch(),
      },
      selectedIndex: gameState.selectedIndex,
      time: this.dayNightCycle.getTime(),
      modifiedBlocks: this.world.getModifiedBlocks(),
    }

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {
      // localStorage may be unavailable or full
    }
  }

  load(): boolean {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return false

    try {
      const data: SaveData = JSON.parse(raw)
      if (typeof data.seed === 'number') {
        this.world.setSeed(data.seed)
      }

      if (data.player) {
        this.controller.setPosition(data.player.x, data.player.y, data.player.z)
        this.controller.setRotation(data.player.yaw, data.player.pitch)
      }

      if (typeof data.selectedIndex === 'number') {
        setSelectedIndex(data.selectedIndex)
      }

      if (typeof data.time === 'number') {
        this.dayNightCycle.setTime(data.time)
      }

      if (Array.isArray(data.modifiedBlocks)) {
        this.world.clearModifiedBlocks()
        this.generateChunksForModifiedBlocks(data.modifiedBlocks)
        this.world.applyModifiedBlocks(data.modifiedBlocks)
        this.rebuildModifiedChunkMeshes(data.modifiedBlocks)
      }
      return true
    } catch {
      // ignore corrupted save data
      return false
    }
  }

  private generateChunksForModifiedBlocks(modifiedBlocks: [string, BlockType][]): void {
    const chunks = new Set<string>()
    for (const [key] of modifiedBlocks) {
      const [x, , z] = key.split(',').map(Number)
      const chunk = worldToChunk(x, z)
      chunks.add(`${chunk.x},${chunk.z}`)
    }
    for (const key of chunks) {
      const [cx, cz] = key.split(',').map(Number)
      this.world.generateChunk(cx, cz)
    }
  }

  private rebuildModifiedChunkMeshes(modifiedBlocks: [string, BlockType][]): void {
    const chunksToRebuild = new Set<string>()
    for (const [key] of modifiedBlocks) {
      const [x, , z] = key.split(',').map(Number)
      const chunk = worldToChunk(x, z)
      chunksToRebuild.add(`${chunk.x},${chunk.z}`)

      const lx = x - chunk.x * CHUNK_SIZE
      const lz = z - chunk.z * CHUNK_SIZE
      if (lx === 0) chunksToRebuild.add(`${chunk.x - 1},${chunk.z}`)
      if (lx === CHUNK_SIZE - 1) chunksToRebuild.add(`${chunk.x + 1},${chunk.z}`)
      if (lz === 0) chunksToRebuild.add(`${chunk.x},${chunk.z - 1}`)
      if (lz === CHUNK_SIZE - 1) chunksToRebuild.add(`${chunk.x},${chunk.z + 1}`)
    }

    for (const key of chunksToRebuild) {
      const [cx, cz] = key.split(',').map(Number)
      this.worldRenderer.buildChunkMesh(cx, cz)
    }
  }
}
