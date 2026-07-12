import { defineStore } from 'pinia'
import { Game } from '@/engine/Game'
import { World } from '@/engine/world/World'
import { BlockId } from '@/engine/world/BlockId'

interface Toast {
  id: number
  text: string
  ts: number
}

interface GameState {
  /** 是否已初始化 */
  ready: boolean
  /** 当前是否在游戏中 */
  inGame: boolean
  /** 主菜单显示 */
  showMainMenu: boolean
  /** 世界种子 */
  seed: string
  /** 模式：survival / creative */
  mode: 'survival' | 'creative'
  /** 难度 */
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard'
  /** 玩家朝向 */
  yaw: number
  pitch: number
  /** 玩家位置 */
  position: { x: number, y: number, z: number }
  /** 玩家生命/饥饿 */
  health: number
  hunger: number
  oxygen: number
  /** 选中方块 */
  selectedBlock: { x: number, y: number, z: number, id: number } | null
  /** Hotbar 槽位 */
  hotbarSlot: number
  /** Inventory（36 槽） */
  inventory: ({ id: BlockId, count: number } | null)[]
  /** UI 状态 */
  ui: {
    showInventory: boolean
    showDebug: boolean
    showPauseMenu: boolean
    showCraftingTable: boolean
    showFurnace: boolean
    showDeath: boolean
  }
  /** 提示 */
  toasts: Toast[]
  /** 时间（0-24000） */
  timeOfDay: number
  /** FPS */
  fps: number
  /** 已加载区块数 */
  chunkCount: number
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    ready: false,
    inGame: false,
    showMainMenu: true,
    seed: 'voxelcraft',
    mode: 'survival',
    difficulty: 'normal',
    yaw: 0,
    pitch: 0,
    position: { x: 0, y: 80, z: 0 },
    health: 20,
    hunger: 20,
    oxygen: 20,
    selectedBlock: null,
    hotbarSlot: 0,
    inventory: new Array(36).fill(null),
    ui: {
      showInventory: false,
      showDebug: false,
      showPauseMenu: false,
      showCraftingTable: false,
      showFurnace: false,
      showDeath: false,
    },
    toasts: [],
    timeOfDay: 6000,
    fps: 0,
    chunkCount: 0,
  }),
  getters: {
    isDay(state): boolean {
      const t = state.timeOfDay / 24000
      return t > 0.25 && t < 0.75
    },
    timeString(state): string {
      const t = (state.timeOfDay / 24000) * 24 * 60
      const h = Math.floor(t / 60) % 24
      const m = Math.floor(t % 60)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    },
  },
  actions: {
    init(canvas: HTMLCanvasElement) {
      this.ready = true
    },
    setShowMainMenu(b: boolean) {
      this.showMainMenu = b
    },
    setInGame(b: boolean) {
      this.inGame = b
    },
    setSeed(s: string) {
      this.seed = s
    },
    setMode(m: 'survival' | 'creative') {
      this.mode = m
    },
    pushToast(text: string) {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, text, ts: Date.now() })
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id)
      }, 3000)
    },
  },
})
