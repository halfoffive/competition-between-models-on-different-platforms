import * as THREE from 'three'
import { World } from '../world/World'
import { AABB } from './AABB'
import { BlockId, isBlockIdFluid, isBlockIdSolid } from '../world/BlockId'

/** 玩家状态：行走 / 疾跑 / 潜行 / 飞行 / 游泳 / 溺水 */
export type PlayerState = 'ground' | 'jump' | 'fall' | 'fly' | 'swim' | 'sleep'

export interface PlayerOptions {
  width?: number
  height?: number
  eyeHeight?: number
  walkSpeed?: number
  sprintSpeed?: number
  sneakSpeed?: number
  flySpeed?: number
  jumpVelocity?: number
  gravity?: number
}

export interface PlayerSnapshot {
  position: THREE.Vector3
  yaw: number
  pitch: number
  velocity: THREE.Vector3
  onGround: boolean
  inWater: boolean
  inLava: boolean
  flying: boolean
  sneaking: boolean
  sprinting: boolean
  health: number
  hunger: number
  saturation: number
  mode: 'survival' | 'creative'
  hotbarSlot: number
  inventory: (ItemStack | null)[]
  oxygen: number
  bedSpawn: { x: number; y: number; z: number } | null
}

export interface ItemStack {
  id: BlockId
  count: number
}

export class Player {
  position: THREE.Vector3 = new THREE.Vector3(0, 80, 0)
  velocity: THREE.Vector3 = new THREE.Vector3()
  yaw = 0
  pitch = 0
  onGround = false
  inWater = false
  inLava = false
  flying = false
  sneaking = false
  sprinting = false
  health = 20
  hunger = 20
  saturation = 5
  oxygen = 20
  state: PlayerState = 'fall'
  mode: 'survival' | 'creative' = 'survival'
  hotbarSlot = 0
  inventory: (ItemStack | null)[] = new Array(36).fill(null)
  bedSpawn: { x: number; y: number; z: number } | null = null
  /** 简单无敌时间 */
  invulnerableTicks = 0
  /** 死亡回调 */
  onDeath: (() => void) | null = null
  /** 受伤回调 */
  onDamage: (() => void) | null = null

  width: number
  height: number
  eyeHeight: number
  walkSpeed: number
  sprintSpeed: number
  sneakSpeed: number
  flySpeed: number
  jumpVelocity: number
  gravity: number

  constructor(options: PlayerOptions = {}) {
    this.width = options.width ?? 0.6
    this.height = options.height ?? 1.8
    this.eyeHeight = options.eyeHeight ?? 1.62
    this.walkSpeed = options.walkSpeed ?? 4.3
    this.sprintSpeed = options.sprintSpeed ?? 5.6
    this.sneakSpeed = options.sneakSpeed ?? 1.3
    this.flySpeed = options.flySpeed ?? 11
    this.jumpVelocity = options.jumpVelocity ?? 8.4
    this.gravity = options.gravity ?? 32
  }

  getAABB(): AABB {
    const hw = this.width / 2
    return AABB.from(
      this.position.x - hw,
      this.position.y,
      this.position.z - hw,
      this.width,
      this.height,
      this.width,
    )
  }

  getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight, this.position.z)
  }

  setMode(m: 'survival' | 'creative') {
    this.mode = m
    if (m === 'creative') {
      this.flying = true
      this.health = 20
      this.hunger = 20
    } else {
      this.flying = false
    }
  }

  /** 切换飞行 */
  toggleFly() {
    if (this.mode !== 'creative') return
    this.flying = !this.flying
    if (this.flying) this.velocity.set(0, 0, 0)
  }

  /** 应用移动：每帧 dt 调用 */
  move(world: World, input: PlayerInput, dt: number) {
    // 速度方向
    const yawRad = this.yaw
    const forward = new THREE.Vector3(-Math.sin(yawRad), 0, -Math.cos(yawRad))
    const right = new THREE.Vector3(Math.cos(yawRad), 0, -Math.sin(yawRad))

    let wantX = 0
    let wantZ = 0
    if (input.forward) wantZ += 1
    if (input.back) wantZ -= 1
    if (input.right) wantX += 1
    if (input.left) wantX -= 1
    // 标准化
    const len = Math.hypot(wantX, wantZ)
    if (len > 0) { wantX /= len; wantZ /= len }

    let speed = this.walkSpeed
    if (this.sneaking) speed = this.sneakSpeed
    else if (this.sprinting && input.forward && this.hunger > 6) speed = this.sprintSpeed

    if (this.flying) {
      this.velocity.x = (forward.x * wantZ + right.x * wantX) * speed
      this.velocity.z = (forward.z * wantZ + right.z * wantX) * speed
      let vy = 0
      if (input.jump) vy += 1
      if (input.sneak) vy -= 1
      this.velocity.y = vy * this.flySpeed
    } else {
      // 目标水平速度
      const targetVx = (forward.x * wantZ + right.x * wantX) * speed
      const targetVz = (forward.z * wantZ + right.z * wantX) * speed
      // 水平加速度
      const accel = this.onGround ? 30 : 8
      this.velocity.x += (targetVx - this.velocity.x) * Math.min(1, accel * dt)
      this.velocity.z += (targetVz - this.velocity.z) * Math.min(1, accel * dt)

      // 流体
      if (this.inWater) {
        this.velocity.x *= 0.85
        this.velocity.z *= 0.85
        if (input.jump) {
          this.velocity.y = Math.min(this.velocity.y + 12 * dt, 3)
        } else {
          this.velocity.y -= this.gravity * 0.3 * dt
        }
      } else if (this.inLava) {
        this.velocity.x *= 0.6
        this.velocity.z *= 0.6
        if (input.jump) {
          this.velocity.y = Math.min(this.velocity.y + 10 * dt, 2.5)
        } else {
          this.velocity.y -= this.gravity * 0.3 * dt
        }
      } else {
        // 跳跃
        if (input.jump && this.onGround) {
          this.velocity.y = this.jumpVelocity
          this.onGround = false
        }
        // 重力
        this.velocity.y -= this.gravity * dt
        // 终端速度
        if (this.velocity.y < -50) this.velocity.y = -50
      }
    }

    // 应用速度并解析碰撞
    this.applyMotion(world, dt)
  }

  private applyMotion(world: World, dt: number) {
    // 收集碰撞方块 AABB
    this.updateFluidState(world)
    // X
    this.position.x += this.velocity.x * dt
    this.resolveCollisionsX(world)
    // Y
    this.position.y += this.velocity.y * dt
    this.onGround = false
    this.resolveCollisionsY(world)
    // Z
    this.position.z += this.velocity.z * dt
    this.resolveCollisionsZ(world)
  }

  private updateFluidState(world: World) {
    const p = this.position
    const head = world.getBlock(Math.floor(p.x), Math.floor(p.y + this.eyeHeight), Math.floor(p.z))
    const feet = world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))
    this.inWater = (head === BlockId.WATER || feet === BlockId.WATER)
    this.inLava = (head === BlockId.LAVA || feet === BlockId.LAVA)
  }

  private getCollidingBlocks(world: World, axis: 'x' | 'y' | 'z'): { x: number; y: number; z: number }[] {
    const aabb = this.getAABB()
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX - 1e-6)
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY - 1e-6)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ - 1e-6)
    const out: { x: number; y: number; z: number }[] = []
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const b = world.getBlock(x, y, z)
          if (isBlockIdSolid(b)) out.push({ x, y, z })
        }
      }
    }
    return out
  }

  private resolveCollisionsX(world: World) {
    const blocks = this.getCollidingBlocks(world, 'x')
    if (blocks.length === 0) return
    const aabb = this.getAABB()
    for (const b of blocks) {
      const blockAabb = AABB.from(b.x, b.y, b.z, 1, 1, 1)
      if (!aabb.intersects(blockAabb)) continue
      if (this.velocity.x > 0) {
        this.position.x = b.x - this.width / 2 - 1e-4
        this.velocity.x = 0
      } else if (this.velocity.x < 0) {
        this.position.x = b.x + 1 + this.width / 2 + 1e-4
        this.velocity.x = 0
      }
    }
  }

  private resolveCollisionsY(world: World) {
    const blocks = this.getCollidingBlocks(world, 'y')
    if (blocks.length === 0) return
    const aabb = this.getAABB()
    for (const b of blocks) {
      const blockAabb = AABB.from(b.x, b.y, b.z, 1, 1, 1)
      if (!aabb.intersects(blockAabb)) continue
      if (this.velocity.y > 0) {
        this.position.y = b.y - this.height - 1e-4
        this.velocity.y = 0
      } else if (this.velocity.y < 0) {
        this.position.y = b.y + 1
        this.velocity.y = 0
        this.onGround = true
      }
    }
  }

  private resolveCollisionsZ(world: World) {
    const blocks = this.getCollidingBlocks(world, 'z')
    if (blocks.length === 0) return
    const aabb = this.getAABB()
    for (const b of blocks) {
      const blockAabb = AABB.from(b.x, b.y, b.z, 1, 1, 1)
      if (!aabb.intersects(blockAabb)) continue
      if (this.velocity.z > 0) {
        this.position.z = b.z - this.width / 2 - 1e-4
        this.velocity.z = 0
      } else if (this.velocity.z < 0) {
        this.position.z = b.z + 1 + this.width / 2 + 1e-4
        this.velocity.z = 0
      }
    }
  }

  /** 摔落伤害 */
  applyFallDamage() {
    if (this.flying || this.mode === 'creative') return
    const fallDist = this.lastFallDistance
    if (fallDist > 3) {
      const damage = Math.floor(fallDist - 3)
      this.damage(damage, 'fall')
    }
    this.lastFallDistance = 0
  }

  private lastFallDistance = 0

  damage(amount: number, source: 'fall' | 'mob' | 'lava' | 'suffocate' | 'starve') {
    if (this.invulnerableTicks > 0 && source !== 'fall') return
    if (this.mode === 'creative') return
    this.health = Math.max(0, this.health - amount)
    this.invulnerableTicks = 10
    this.onDamage?.()
    if (this.health <= 0) {
      this.onDeath?.()
    }
  }

  heal(amount: number) {
    this.health = Math.min(20, this.health + amount)
  }

  /** 饥饿随时间下降 + 生命回复 */
  tickSurvival(dt: number) {
    if (this.mode === 'creative') {
      this.hunger = 20
      this.health = 20
      this.oxygen = 20
      return
    }
    if (this.invulnerableTicks > 0) this.invulnerableTicks--
    // 摔落累积
    if (this.velocity.y < -10) {
      this.lastFallDistance += Math.abs(this.velocity.y) * dt
    } else if (this.onGround) {
      this.applyFallDamage()
    }
    // 溺水
    if (this.inWater && this.getAABB().maxY < Math.floor(this.position.y + 1)) {
      this.oxygen -= dt * 1
      if (this.oxygen <= 0) {
        this.damage(2, 'suffocate')
        this.oxygen = 0
      }
    } else {
      this.oxygen = Math.min(20, this.oxygen + dt * 4)
    }
    // 岩浆
    if (this.inLava) {
      this.damage(4 * dt, 'lava')
    }
    // 饥饿消耗
    const baseHunger = 0.6 // 每 30s -1
    this.hunger = Math.max(0, this.hunger - baseHunger * dt)
    if (this.hunger <= 0) {
      this.damage(1 * dt, 'starve')
    } else if (this.hunger >= 18 && this.health < 20) {
      this.heal(dt * 0.5)
    }
    // 疾跑额外饥饿
    if (this.sprinting) this.hunger = Math.max(0, this.hunger - 0.6 * dt)
  }

  /** 给玩家添加物品，返回剩余 */
  giveItem(stack: ItemStack): ItemStack | null {
    // 先尝试堆叠
    for (let i = 0; i < this.inventory.length; i++) {
      const s = this.inventory[i]
      if (s && s.id === stack.id && s.count < 64) {
        const add = Math.min(64 - s.count, stack.count)
        s.count += add
        stack.count -= add
        if (stack.count <= 0) return null
      }
    }
    // 找空格
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        const add = Math.min(64, stack.count)
        this.inventory[i] = { id: stack.id, count: add }
        stack.count -= add
        if (stack.count <= 0) return null
      }
    }
    return stack.count > 0 ? stack : null
  }

  /** 拿出当前 hotbar 物品（用于放置）；返回 [item, countLeft] */
  takeFromHotbar(slot: number, n: number = 1): ItemStack | null {
    if (slot < 0 || slot >= 9) return null
    const idx = slot
    const s = this.inventory[idx]
    if (!s) return null
    s.count -= n
    if (s.count <= 0) this.inventory[idx] = null
    return { id: s.id, count: n }
  }

  /** 返还物品到 hotbar（不放置时的撤销） */
  returnToHotbar(slot: number, stack: ItemStack) {
    if (slot < 0 || slot >= 9) return
    const s = this.inventory[slot]
    if (s && s.id === stack.id) {
      s.count += stack.count
    } else {
      this.inventory[slot] = stack
    }
  }

  snapshot(): PlayerSnapshot {
    return {
      position: this.position.clone(),
      yaw: this.yaw,
      pitch: this.pitch,
      velocity: this.velocity.clone(),
      onGround: this.onGround,
      inWater: this.inWater,
      inLava: this.inLava,
      flying: this.flying,
      sneaking: this.sneaking,
      sprinting: this.sprinting,
      health: this.health,
      hunger: this.hunger,
      saturation: this.saturation,
      mode: this.mode,
      hotbarSlot: this.hotbarSlot,
      inventory: this.inventory.map(s => s ? { id: s.id, count: s.count } : null),
      oxygen: this.oxygen,
      bedSpawn: this.bedSpawn,
    }
  }
}

export interface PlayerInput {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
  jump: boolean
  sneak: boolean
  sprint: boolean
}
