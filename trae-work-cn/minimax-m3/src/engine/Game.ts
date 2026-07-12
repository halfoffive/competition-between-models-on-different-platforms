import { World } from './world/World'
import { ChunkRenderer } from './render/ChunkRenderer'
import { Player, PlayerInput, ItemStack } from './physics/Player'
import { MobManager } from './mob/Mob'
import { BlockId, isBlockIdSolid, isBlockIdTransparent } from './world/BlockId'
import { registry } from './world/BlockRegistry'
import { raycastVoxels, RaycastHit } from './physics/Raycast'
import { attackDamage, toolTier } from './crafting/Recipes'
import * as THREE from 'three'

/** UI 状态变化时触发 */
export interface UIState {
  showInventory: boolean
  showDebug: boolean
  showPauseMenu: boolean
  showCraftingTable: boolean
  showFurnace: { x: number; y: number; z: number } | null
  showDeath: boolean
  selectedBlock: { x: number, y: number, z: number, id: BlockId, face: number } | null
  /** 提示文字 */
  toast: string | null
}

/**
 * 游戏主控：串联世界、渲染、玩家、UI。
 */
export class Game {
  readonly world: World
  readonly renderer: ChunkRenderer
  readonly player: Player
  readonly mobs: MobManager
  ui: UIState = {
    showInventory: false,
    showDebug: false,
    showPauseMenu: false,
    showCraftingTable: false,
    showFurnace: null,
    showDeath: false,
    selectedBlock: null,
    toast: null,
  }
  /** 玩家攻击冷却 */
  private attackCooldown = 0
  /** 正在破坏进度 0-1 */
  breakingProgress: number = 0
  /** 正在破坏目标 */
  breakingTarget: { x: number, y: number, z: number, id: BlockId } | null = null
  /** 鼠标按键状态 */
  private mouseLeft = false
  private mouseRight = false
  /** 输入 */
  private input: PlayerInput = { forward: false, back: false, left: false, right: false, jump: false, sneak: false, sprint: false }
  /** 已渲染但需要等 1 帧的玩家位置 */
  private prevPlayerPos = new THREE.Vector3()
  /** canvas 元素 */
  readonly canvas: HTMLCanvasElement
  /** 输入系统是否锁定指针 */
  pointerLocked: boolean = false
  /** 上次更新时间 */
  private lastTime = performance.now()
  /** 帧循环 ID */
  private rafId: number = 0
  /** 主循环回调 */
  onTick: ((dt: number, fps: number) => void) | null = null
  /** UI 状态变化回调 */
  onUIChange: (() => void) | null = null
  /** 玩家死亡回调 */
  onPlayerDeath: (() => void) | null = null
  /** 玩家伤害回调 */
  onPlayerDamage: (() => void) | null = null

  /** 合成网格：3x3 工作台或 2x2 玩家 */
  craftingGrid: (BlockId | null)[] = [null, null, null, null, null, null, null, null, null]
  /** 玩家合成 2x2 */
  inventoryCraftingGrid: (BlockId | null)[] = [null, null, null, null]

  constructor(canvas: HTMLCanvasElement, world: World) {
    this.canvas = canvas
    this.world = world
    this.renderer = new ChunkRenderer(world, canvas)
    this.player = new Player()
    this.mobs = new MobManager(world, this.player)

    this.world.addListener({
      onChunkLoaded: (chunk) => {
        this.renderer.buildChunkMesh(chunk)
        this.mobs.maybeSpawnInChunk(chunk.cx, chunk.cz)
      },
      onChunkUnloaded: (chunk) => {
        this.renderer.removeChunk(chunk.cx, chunk.cz)
      }
    })

    this.player.onDeath = () => {
      this.ui.showDeath = true
      this.onPlayerDeath?.()
    }
    this.player.onDamage = () => {
      this.onPlayerDamage?.()
    }
  }

  /** 玩家初始位置：放置在世界出生点上方 */
  findSpawn(): THREE.Vector3 {
    const x = 0
    const z = 0
    for (let y = 100; y > 0; y--) {
      const b = this.world.getBlock(x, y, z)
      if (b !== BlockId.AIR && b !== BlockId.WATER) {
        return new THREE.Vector3(x + 0.5, y + 1, z + 0.5)
      }
    }
    return new THREE.Vector3(0, 80, 0)
  }

  start() {
    // 初始加载玩家周围区块
    const sp = this.findSpawn()
    this.player.position.copy(sp)
    this.world.updateAroundPlayer(sp.x, sp.z)
    this.lastTime = performance.now()
    this.tick()
  }

  stop() {
    cancelAnimationFrame(this.rafId)
  }

  /** 主循环 */
  tick = () => {
    this.rafId = requestAnimationFrame(this.tick)
    const now = performance.now()
    const dt = Math.min(0.05, (now - this.lastTime) / 1000)
    this.lastTime = now

    // 处理移动
    this.player.sneaking = this.input.sneak
    this.player.sprinting = this.input.sprint
    this.player.move(this.world, this.input, dt)

    // 玩家生存更新
    this.player.tickSurvival(dt)

    // 移动后更新区块
    if (Math.abs(this.player.position.x - this.prevPlayerPos.x) > 8 || Math.abs(this.player.position.z - this.prevPlayerPos.z) > 8) {
      this.world.updateAroundPlayer(this.player.position.x, this.player.position.z)
      this.prevPlayerPos.copy(this.player.position)
    } else {
      this.world.updateAroundPlayer(this.player.position.x, this.player.position.z)
    }

    // 更新生物
    this.mobs.update(dt)

    // 更新相机
    const eye = this.player.getEyePosition()
    this.renderer.camera.position.copy(eye)
    this.renderer.camera.rotation.order = 'YXZ'
    this.renderer.camera.rotation.y = this.player.yaw
    this.renderer.camera.rotation.x = this.player.pitch

    // 选中方块
    const dir = new THREE.Vector3()
    this.renderer.camera.getWorldDirection(dir)
    const hit = raycastVoxels(this.world, eye, dir, { maxDistance: 6 })
    if (hit) {
      this.ui.selectedBlock = { x: hit.x, y: hit.y, z: hit.z, id: hit.block, face: 0 }
      this.renderer.setSelected(hit.x, hit.y, hit.z)
    } else {
      this.ui.selectedBlock = null
      this.renderer.setSelected(null, null, null)
    }

    // 攻击
    this.attackCooldown = Math.max(0, this.attackCooldown - dt)
    if (this.mouseLeft && hit && this.attackCooldown <= 0) {
      const slot = this.player.inventory[this.player.hotbarSlot]
      const dmg = attackDamage(slot?.id ?? null)
      // 攻击附近生物
      for (const mob of Array.from(this.mobs.mobs.values())) {
        const dx = mob.position.x - (hit.x + 0.5)
        const dy = mob.position.y + 0.5 - (hit.y + 0.5)
        const dz = mob.position.z - (hit.z + 0.5)
        if (Math.hypot(dx, dz) < 1.6 && dy < 1.5 && dy > -0.5) {
          if (mob.damage(dmg)) {
            this.handleMobDeath(mob)
            this.mobs.despawn(mob.id)
          }
        }
      }
      this.attackCooldown = 0.3
    }

    // 破坏 / 放置
    if (this.mouseLeft && !this.ui.showInventory) {
      if (hit) {
        const target = { x: hit.x, y: hit.y, z: hit.z, id: hit.block }
        if (!this.breakingTarget || this.breakingTarget.x !== target.x || this.breakingTarget.y !== target.y || this.breakingTarget.z !== target.z) {
          this.breakingTarget = target
          this.breakingProgress = 0
        }
        const slot = this.player.inventory[this.player.hotbarSlot]
        const tool = slot?.id ?? null
        const t = toolTier(tool)
        const bt = registry.breakTime(hit.block, t, this.player.mode === 'creative')
        if (bt <= 0) {
          // 瞬时破坏
          this.breakBlock(hit)
          this.breakingProgress = 0
        } else {
          this.breakingProgress += dt * 20 / bt
          if (this.breakingProgress >= 1) {
            this.breakBlock(hit)
            this.breakingProgress = 0
          }
        }
        this.renderer.setBreakProgress(this.breakingProgress)
      } else {
        this.breakingTarget = null
        this.breakingProgress = 0
        this.renderer.setBreakProgress(0)
      }
    } else if (this.mouseRight && !this.ui.showInventory) {
      // 放置
      if (hit) {
        const slot = this.player.inventory[this.player.hotbarSlot]
        if (slot && slot.count > 0) {
          const placeId = slot.id
          // 不可放置流体 / 工具
          if (placeId !== BlockId.WATER && placeId !== BlockId.LAVA && this.isPlaceable(placeId)) {
            const px = hit.x + hit.normal[0]
            const py = hit.y + hit.normal[1]
            const pz = hit.z + hit.normal[2]
            // 不能与玩家碰撞
            const aabb = this.player.getAABB()
            const blockAabb = { minX: px, minY: py, minZ: pz, maxX: px + 1, maxY: py + 1, maxZ: pz + 1 }
            const intersects = aabb.minX < blockAabb.maxX && aabb.maxX > blockAabb.minX &&
              aabb.minY < blockAabb.maxY && aabb.maxY > blockAabb.minY &&
              aabb.minZ < blockAabb.maxZ && aabb.maxZ > blockAabb.minZ
            if (!intersects) {
              const ok = this.world.setBlock(px, py, pz, placeId)
              if (ok) {
                slot.count--
                if (slot.count <= 0) this.player.inventory[this.player.hotbarSlot] = null
              }
            }
          }
        }
      }
      // 防止持续放置
      this.mouseRight = false
    } else {
      this.breakingTarget = null
      this.breakingProgress = 0
      this.renderer.setBreakProgress(0)
    }

    this.renderer.updateDirtyChunks()
    this.renderer.tick()

    this.onTick?.(dt, this.renderer.fps)
  }

  private isPlaceable(id: BlockId): boolean {
    // 工具/装饰品类的部分 ID 不可直接放置
    return id !== BlockId.AIR
  }

  private breakBlock(hit: RaycastHit) {
    const prop = registry.get(hit.block)
    if (!prop.drops) {
      this.world.setBlock(hit.x, hit.y, hit.z, BlockId.AIR)
      return
    }
    if (this.player.mode === 'creative') {
      // 创造模式不掉落
      this.world.setBlock(hit.x, hit.y, hit.z, BlockId.AIR)
      return
    }
    // 给予物品
    let dropId = hit.block
    if (hit.block === BlockId.STONE) dropId = BlockId.COBBLESTONE
    if (hit.block === BlockId.COAL_ORE) dropId = BlockId.COAL
    if (hit.block === BlockId.IRON_ORE) dropId = registry.breakTime(hit.block, toolTier(this.player.inventory[this.player.hotbarSlot]?.id ?? null), false) > 0 && Math.random() < 0.3 ? BlockId.IRON_INGOT : dropId
    if (hit.block === BlockId.DIAMOND_ORE) dropId = Math.random() < 0.5 ? BlockId.DIAMOND : dropId
    if (hit.block === BlockId.GRASS) dropId = BlockId.DIRT
    this.player.giveItem({ id: dropId, count: 1 })
    this.world.setBlock(hit.x, hit.y, hit.z, BlockId.AIR)
  }

  private handleMobDeath(mob: import('./mob/Mob').Mob) {
    for (const drop of mob.info.drops) {
      if (!drop.chance || Math.random() < drop.chance) {
        this.player.giveItem({ id: drop.id, count: drop.count })
      }
    }
  }

  setInput(input: Partial<PlayerInput>) {
    Object.assign(this.input, input)
  }

  setMouseLeft(down: boolean) {
    this.mouseLeft = down
    if (!down) {
      this.breakingTarget = null
      this.breakingProgress = 0
      this.renderer.setBreakProgress(0)
    }
  }

  setMouseRight(down: boolean) {
    if (down) this.mouseRight = true
  }

  /** 玩家切换 hotbar 槽位 */
  selectSlot(slot: number) {
    if (slot < 0 || slot >= 9) return
    this.player.hotbarSlot = slot
  }

  /** 设置鼠标视角 */
  rotate(deltaYaw: number, deltaPitch: number) {
    this.player.yaw -= deltaYaw
    this.player.pitch -= deltaPitch
    if (this.player.pitch > Math.PI / 2 - 0.01) this.player.pitch = Math.PI / 2 - 0.01
    if (this.player.pitch < -Math.PI / 2 + 0.01) this.player.pitch = -Math.PI / 2 + 0.01
  }

  /** 玩家打开/关闭物品栏 */
  toggleInventory() {
    this.ui.showInventory = !this.ui.showInventory
    if (!this.ui.showInventory) this.ui.showCraftingTable = false
  }

  /** 切换调试信息 */
  toggleDebug() {
    this.ui.showDebug = !this.ui.showDebug
  }

  /** 切换暂停菜单 */
  togglePause() {
    this.ui.showPauseMenu = !this.ui.showPauseMenu
  }

  /** 切换模式 */
  toggleMode() {
    this.player.setMode(this.player.mode === 'survival' ? 'creative' : 'survival')
  }

  /** 切换飞行 */
  toggleFly() {
    this.player.toggleFly()
  }

  /** 重生 */
  respawn() {
    const sp = this.bedSpawn || this.findSpawn()
    this.player.position.copy(sp)
    this.player.health = 20
    this.player.hunger = 20
    this.player.velocity.set(0, 0, 0)
    this.ui.showDeath = false
  }

  /** 床重生点 */
  get bedSpawn(): { x: number; y: number; z: number } | null {
    return this.player.bedSpawn
  }
  setBedSpawn(pos: { x: number; y: number; z: number }) {
    this.player.bedSpawn = pos
  }

  /** 获取 / 设置玩家物品栏（用于 UI 同步） */
  getInventory(): (ItemStack | null)[] {
    return this.player.inventory
  }

  setInventory(inv: (ItemStack | null)[]) {
    for (let i = 0; i < inv.length; i++) {
      this.player.inventory[i] = inv[i] ? { id: inv[i]!.id, count: inv[i]!.count } : null
    }
  }

  setCraftingGrid(grid: (BlockId | null)[]) {
    this.craftingGrid = [...grid]
  }

  /** 玩家保存 */
  serialize(): string {
    return JSON.stringify({
      seed: this.world.seed,
      player: this.player.snapshot(),
      chunks: Array.from(this.world.chunks.values()).map(c => ({
        cx: c.cx,
        cz: c.cz,
        data: Array.from(c.data),
        skyLight: Array.from(c.skyLight),
        blockLight: Array.from(c.blockLight),
      })),
    })
  }

  /** 玩家加载 */
  loadFromSave(json: string) {
    const obj = JSON.parse(json)
    const snap = obj.player
    this.player.position.fromArray(snap.position)
    this.player.yaw = snap.yaw
    this.player.pitch = snap.pitch
    this.player.health = snap.health
    this.player.hunger = snap.hunger
    this.player.saturation = snap.saturation
    this.player.hotbarSlot = snap.hotbarSlot
    this.player.mode = snap.mode
    this.player.flying = snap.flying
    this.player.bedSpawn = snap.bedSpawn
    for (let i = 0; i < this.player.inventory.length; i++) {
      this.player.inventory[i] = snap.inventory[i] ? { id: snap.inventory[i].id, count: snap.inventory[i].count } : null
    }
    for (const cd of obj.chunks) {
      const { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } = require('./world/Chunk')
      const c = new Chunk(cd.cx, cd.cz)
      c.data = new Uint8Array(cd.data)
      c.skyLight = new Uint8Array(cd.skyLight)
      c.blockLight = new Uint8Array(cd.blockLight)
      c.generated = true
      c.dirty = true
      const key = `${cd.cx},${cd.cz}`
      this.world.chunks.set(key, c)
      this.renderer.buildChunkMesh(c)
    }
  }
}
