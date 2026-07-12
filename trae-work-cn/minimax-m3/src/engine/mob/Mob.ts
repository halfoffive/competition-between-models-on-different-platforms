import * as THREE from 'three'
import { World } from '../world/World'
import { BlockId, isBlockIdSolid, isBlockIdFluid } from '../world/BlockId'
import { Player } from '../physics/Player'
import { registry } from '../world/BlockRegistry'

export type MobType = 'pig' | 'cow' | 'sheep' | 'chicken' | 'zombie' | 'skeleton' | 'creeper' | 'spider'

export type MobBehavior = 'passive' | 'hostile' | 'neutral'

export interface MobTypeInfo {
  health: number
  behavior: MobBehavior
  attackDamage: number
  width: number
  height: number
  speed: number
  drops: { id: BlockId; count: number; chance?: number }[]
  /** 模型颜色（用于 1x1 立方体） */
  color: string
  /** 是否可繁殖（暂不实现） */
  peaceful: boolean
}

export const mobTypes: Record<MobType, MobTypeInfo> = {
  pig: { health: 10, behavior: 'passive', attackDamage: 0, width: 0.9, height: 0.9, speed: 1.0, drops: [{ id: BlockId.BREAD, count: 1, chance: 0.3 }], color: '#f0a0a0', peaceful: true },
  cow: { health: 10, behavior: 'passive', attackDamage: 0, width: 0.9, height: 1.4, speed: 0.9, drops: [{ id: BlockId.IRON_INGOT, count: 1, chance: 0 }], color: '#604030', peaceful: true },
  sheep: { health: 8, behavior: 'passive', attackDamage: 0, width: 0.9, height: 1.3, speed: 0.9, drops: [{ id: BlockId.BREAD, count: 1, chance: 0.2 }], color: '#f0f0f0', peaceful: true },
  chicken: { health: 4, behavior: 'passive', attackDamage: 0, width: 0.4, height: 0.7, speed: 0.7, drops: [{ id: BlockId.BREAD, count: 1, chance: 0.2 }], color: '#f8f0d0', peaceful: true },
  zombie: { health: 20, behavior: 'hostile', attackDamage: 3, width: 0.6, height: 1.95, speed: 1.2, drops: [{ id: BlockId.BREAD, count: 1, chance: 0.2 }], color: '#5fa860', peaceful: false },
  skeleton: { health: 20, behavior: 'hostile', attackDamage: 2, width: 0.6, height: 1.95, speed: 1.2, drops: [{ id: BlockId.COAL, count: 1, chance: 0.2 }], color: '#d0d0c0', peaceful: false },
  creeper: { health: 20, behavior: 'hostile', attackDamage: 10, width: 0.6, height: 1.7, speed: 1.1, drops: [{ id: BlockId.GUNPOWDER, count: 1, chance: 0.5 }], color: '#5fa860', peaceful: false },
  spider: { health: 16, behavior: 'hostile', attackDamage: 2, width: 1.4, height: 0.9, speed: 1.3, drops: [{ id: BlockId.FLINT, count: 1, chance: 0.3 }], color: '#404040', peaceful: false },
}

/** 单个生物实例 */
export class Mob {
  readonly id: number
  readonly type: MobType
  readonly info: MobTypeInfo
  position: THREE.Vector3
  velocity: THREE.Vector3 = new THREE.Vector3()
  yaw = 0
  pitch = 0
  health: number
  onGround = false
  /** AI 状态 */
  state: 'idle' | 'walk' | 'chase' | 'attack' | 'flee' = 'idle'
  /** 上次决策时间 */
  lastDecision = 0
  /** 攻击冷却 */
  attackCooldown = 0
  /** 游走目标 */
  wanderTarget: THREE.Vector3 | null = null
  /** 死亡回调 */
  onDeath: ((mob: Mob) => void) | null = null
  /** 攻击回调 */
  onAttack: ((mob: Mob) => void) | null = null

  constructor(id: number, type: MobType, x: number, y: number, z: number) {
    this.id = id
    this.type = type
    this.info = mobTypes[type]
    this.position = new THREE.Vector3(x, y, z)
    this.health = this.info.health
  }

  damage(amount: number): boolean {
    if (this.health <= 0) return false
    this.health -= amount
    if (this.health <= 0) {
      this.onDeath?.(this)
      return true
    }
    return false
  }
}

/** 生物管理 / 行为更新 */
export class MobManager {
  readonly mobs: Map<number, Mob> = new Map()
  private nextId = 1
  private world: World
  private player: Player
  /** Three.js group 容器 */
  readonly group: THREE.Group
  private mobMeshes: Map<number, THREE.Mesh> = new Map()
  /** 难度 */
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard' = 'normal'
  /** 距离玩家最远生成距离 */
  spawnRadius = 32
  /** tick 计数器 */
  private tickCount = 0

  constructor(world: World, player: Player) {
    this.world = world
    this.player = player
    this.group = new THREE.Group()
  }

  spawn(type: MobType, x: number, y: number, z: number): Mob | null {
    const id = this.nextId++
    const mob = new Mob(id, type, x, y, z)
    this.mobs.set(id, mob)
    // 创建 mesh
    const geom = new THREE.BoxGeometry(this.mobTypes(type).width, this.mobTypes(type).height, this.mobTypes(type).width)
    const mat = new THREE.MeshLambertMaterial({ color: this.mobTypes(type).color })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.position.set(x, y + this.mobTypes(type).height / 2, z)
    this.group.add(mesh)
    this.mobMeshes.set(id, mesh)
    return mob
  }

  private mobTypes(t: MobType) { return mobTypes[t] }

  despawn(id: number) {
    const m = this.mobs.get(id)
    if (!m) return
    this.mobs.delete(id)
    const mesh = this.mobMeshes.get(id)
    if (mesh) {
      this.group.remove(mesh)
      mesh.geometry.dispose()
      ;(mesh.material as THREE.Material).dispose()
      this.mobMeshes.delete(id)
    }
  }

  /** 加载的区块触发生物生成 */
  maybeSpawnInChunk(cx: number, cz: number) {
    if (this.difficulty === 'peaceful') return
    const r = 8
    for (let i = 0; i < 3; i++) {
      const lx = (cx * 16) + Math.floor(Math.random() * 16)
      const lz = (cz * 16) + Math.floor(Math.random() * 16)
      // 找地表
      for (let y = 100; y > 0; y--) {
        const b = this.world.getBlock(lx, y, lz)
        if (b === BlockId.GRASS) {
          const dx = lx - this.player.position.x
          const dz = lz - this.player.position.z
          if (Math.hypot(dx, dz) > 24) continue
          // 光照
          const sky = this.world.getBlock(lx, y + 2, lz)
          // 简化：随机被动生物
          if (Math.random() < 0.3) {
            const types: MobType[] = ['pig', 'cow', 'sheep', 'chicken']
            this.spawn(types[Math.floor(Math.random() * types.length)], lx, y + 1, lz)
          } else if (sky === BlockId.AIR) {
            const h: MobType[] = ['zombie', 'skeleton', 'spider']
            this.spawn(h[Math.floor(Math.random() * h.length)], lx, y + 1, lz)
          }
          break
        }
      }
    }
  }

  update(dt: number) {
    this.tickCount++
    const playerPos = this.player.position
    for (const mob of Array.from(this.mobs.values())) {
      this.updateMob(mob, playerPos, dt)
      // 同步 mesh
      const mesh = this.mobMeshes.get(mob.id)
      if (mesh) {
        mesh.position.set(mob.position.x, mob.position.y + mob.info.height / 2, mob.position.z)
        mesh.rotation.y = -mob.yaw
      }
    }
    // 清理距离过远的生物
    for (const mob of Array.from(this.mobs.values())) {
      const d = Math.hypot(mob.position.x - playerPos.x, mob.position.z - playerPos.z)
      if (d > this.spawnRadius * 1.5) {
        this.despawn(mob.id)
      }
    }
  }

  private updateMob(mob: Mob, playerPos: THREE.Vector3, dt: number) {
    const info = mob.info
    const dx = playerPos.x - mob.position.x
    const dz = playerPos.z - mob.position.z
    const distToPlayer = Math.hypot(dx, dz)
    const aggroRange = info.behavior === 'hostile' ? 16 : 6
    const attackRange = info.behavior === 'hostile' ? 1.5 : 999

    // 决策
    mob.lastDecision += dt
    if (mob.lastDecision > 0.5) {
      mob.lastDecision = 0
      if (info.behavior === 'hostile') {
        if (distToPlayer < aggroRange) {
          mob.state = 'chase'
        } else {
          mob.state = 'idle'
        }
      } else {
        if (distToPlayer < 3) {
          mob.state = 'flee'
        } else {
          mob.state = Math.random() < 0.4 ? 'walk' : 'idle'
        }
      }
    }

    let wantX = 0
    let wantZ = 0

    if (mob.state === 'chase') {
      const len = Math.hypot(dx, dz) || 1
      wantX = dx / len
      wantZ = dz / len
      mob.yaw = Math.atan2(dx, dz)
    } else if (mob.state === 'flee') {
      const len = Math.hypot(dx, dz) || 1
      wantX = -dx / len
      wantZ = -dz / len
      mob.yaw = Math.atan2(dx, dz)
    } else if (mob.state === 'walk') {
      if (!mob.wanderTarget) {
        mob.wanderTarget = new THREE.Vector3(
          mob.position.x + (Math.random() - 0.5) * 8,
          mob.position.y,
          mob.position.z + (Math.random() - 0.5) * 8,
        )
        mob.yaw = Math.random() * Math.PI * 2
      }
      const tx = mob.wanderTarget.x - mob.position.x
      const tz = mob.wanderTarget.z - mob.position.z
      const td = Math.hypot(tx, tz)
      if (td < 0.5) mob.wanderTarget = null
      else {
        wantX = tx / td
        wantZ = tz / td
        mob.yaw = Math.atan2(tx, tz)
      }
    }

    const speed = info.speed
    mob.velocity.x = wantX * speed
    mob.velocity.z = wantZ * speed
    // 重力
    if (!this.isOnGround(mob)) {
      mob.velocity.y -= 32 * dt
    } else {
      if (mob.velocity.y < 0) mob.velocity.y = 0
      // 跳跃
      const inFront = this.world.getBlock(
        Math.floor(mob.position.x + wantX * 0.6),
        Math.floor(mob.position.y + 1),
        Math.floor(mob.position.z + wantZ * 0.6)
      )
      if (isBlockIdSolid(inFront) && (mob.state === 'chase' || mob.state === 'walk')) {
        mob.velocity.y = 8
      }
    }
    mob.velocity.y = Math.max(-30, mob.velocity.y)

    // 移动
    mob.position.x += mob.velocity.x * dt
    mob.position.y += mob.velocity.y * dt
    mob.position.z += mob.velocity.z * dt
    // 简单碰撞：地形
    this.resolveCollision(mob)

    // 攻击
    mob.attackCooldown = Math.max(0, mob.attackCooldown - dt)
    if (info.behavior === 'hostile' && distToPlayer < attackRange && mob.attackCooldown <= 0) {
      this.player.damage(info.attackDamage, 'mob')
      mob.attackCooldown = 1.0
      mob.onAttack?.(mob)
    }
  }

  private isOnGround(mob: Mob): boolean {
    const x = Math.floor(mob.position.x)
    const z = Math.floor(mob.position.z)
    const y = Math.floor(mob.position.y - 0.05)
    const b = this.world.getBlock(x, y, z)
    return isBlockIdSolid(b)
  }

  private resolveCollision(mob: Mob) {
    const info = mob.info
    const hw = info.width / 2
    const minX = Math.floor(mob.position.x - hw)
    const maxX = Math.floor(mob.position.x + hw - 0.001)
    const minY = Math.floor(mob.position.y)
    const maxY = Math.floor(mob.position.y + info.height - 0.001)
    const minZ = Math.floor(mob.position.z - hw)
    const maxZ = Math.floor(mob.position.z + hw - 0.001)
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const b = this.world.getBlock(x, y, z)
          if (!isBlockIdSolid(b)) continue
          // 简化：X 轴
          if (mob.velocity.x > 0 && mob.position.x + hw > x && mob.position.x - hw < x + 1) {
            if (mob.position.y + info.height > y && mob.position.y < y + 1) {
              if (mob.position.z + hw > z && mob.position.z - hw < z + 1) {
                mob.position.x = x - hw - 0.001
                mob.velocity.x = 0
              }
            }
          }
          if (mob.velocity.x < 0 && mob.position.x - hw < x + 1 && mob.position.x + hw > x) {
            if (mob.position.y + info.height > y && mob.position.y < y + 1) {
              if (mob.position.z + hw > z && mob.position.z - hw < z + 1) {
                mob.position.x = x + 1 + hw + 0.001
                mob.velocity.x = 0
              }
            }
          }
          if (mob.velocity.z > 0 && mob.position.z + hw > z && mob.position.z - hw < z + 1) {
            if (mob.position.y + info.height > y && mob.position.y < y + 1) {
              if (mob.position.x + hw > x && mob.position.x - hw < x + 1) {
                mob.position.z = z - hw - 0.001
                mob.velocity.z = 0
              }
            }
          }
          if (mob.velocity.z < 0 && mob.position.z - hw < z + 1 && mob.position.z + hw > z) {
            if (mob.position.y + info.height > y && mob.position.y < y + 1) {
              if (mob.position.x + hw > x && mob.position.x - hw < x + 1) {
                mob.position.z = z + 1 + hw + 0.001
                mob.velocity.z = 0
              }
            }
          }
          if (mob.velocity.y < 0 && mob.position.y < y + 1 && mob.position.y + info.height > y) {
            if (mob.position.x + hw > x && mob.position.x - hw < x + 1) {
              if (mob.position.z + hw > z && mob.position.z - hw < z + 1) {
                mob.position.y = y + 1
                mob.velocity.y = 0
              }
            }
          }
          if (mob.velocity.y > 0 && mob.position.y + info.height > y && mob.position.y < y + 1) {
            if (mob.position.x + hw > x && mob.position.x - hw < x + 1) {
              if (mob.position.z + hw > z && mob.position.z - hw < z + 1) {
                mob.position.y = y - info.height
                mob.velocity.y = 0
              }
            }
          }
        }
      }
    }
  }
}
