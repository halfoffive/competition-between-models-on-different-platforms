import * as THREE from 'three'
import { BLOCK, SEA_LEVEL } from './blocks.js'
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js'
import { Terrain } from './Terrain.js'
import { createTextureAtlas } from './textures.js'

// 世界管理类：负责区块的动态加载/卸载、网格重建
export class World {
  constructor(scene, store) {
    this.scene = scene
    this.store = store
    this.chunks = new Map() // key: "cx,cz" -> Chunk
    this.terrain = null
    this.material = null // opaque 材质
    this.transparentMaterial = null
    this.buildQueue = [] // 待重建网格的区块队列
    this.loadList = [] // 待生成的区块列表（按距离排序）
    this.lastChunkX = Infinity
    this.lastChunkZ = Infinity
  }

  init(seed) {
    this.terrain = new Terrain(seed)
    // 创建材质（使用程序化纹理图集）
    const atlas = createTextureAtlas()
    this.material = new THREE.MeshLambertMaterial({
      map: atlas,
      side: THREE.FrontSide
    })
    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: atlas,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false
    })
    // 初始加载玩家周围区块（中心 3x3 立即生成，其余由 update 渐进加载）
    const px = this.store.playerPos.x
    const pz = this.store.playerPos.z
    const pcx = Math.floor(px / CHUNK_SIZE)
    const pcz = Math.floor(pz / CHUNK_SIZE)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.generateChunk(pcx + dx, pcz + dz)
      }
    }
    // 立即构建初始区块网格
    while (this.buildQueue.length > 0) {
      const chunk = this.buildQueue.shift()
      if (chunk && this.chunks.has(this.key(chunk.cx, chunk.cz))) {
        this.buildMeshFor(chunk)
        chunk.dirty = false
      }
    }
    this.lastChunkX = pcx
    this.lastChunkZ = pcz
    this.updateLoadList(pcx, pcz, this.store.renderDistance)
  }

  key(cx, cz) {
    return `${cx},${cz}`
  }

  // 全局坐标取方块
  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BLOCK.AIR
    const cx = Math.floor(wx / CHUNK_SIZE)
    const cz = Math.floor(wz / CHUNK_SIZE)
    const chunk = this.chunks.get(this.key(cx, cz))
    if (!chunk || !chunk.generated) return BLOCK.AIR
    const lx = wx - cx * CHUNK_SIZE
    const lz = wz - cz * CHUNK_SIZE
    return chunk.getBlock(lx, wy, lz)
  }

  // 全局坐标设方块
  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return
    const cx = Math.floor(wx / CHUNK_SIZE)
    const cz = Math.floor(wz / CHUNK_SIZE)
    const chunk = this.chunks.get(this.key(cx, cz))
    if (!chunk) return
    const lx = wx - cx * CHUNK_SIZE
    const lz = wz - cz * CHUNK_SIZE
    chunk.setBlock(lx, wy, lz, id)
    chunk.dirty = true
    this.enqueueRebuild(chunk)
    // 边界邻居也要重建
    if (lx === 0) this.markDirty(cx - 1, cz)
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz)
    if (lz === 0) this.markDirty(cx, cz - 1)
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1)
  }

  markDirty(cx, cz) {
    const c = this.chunks.get(this.key(cx, cz))
    if (c) {
      c.dirty = true
      this.enqueueRebuild(c)
    }
  }

  enqueueRebuild(chunk) {
    if (!this.buildQueue.includes(chunk)) this.buildQueue.push(chunk)
  }

  // 更新加载列表：收集渲染距离内缺失的区块，按距离排序
  updateLoadList(pcx, pcz, rd) {
    const list = []
    for (let dx = -rd; dx <= rd; dx++) {
      for (let dz = -rd; dz <= rd; dz++) {
        const cx = pcx + dx
        const cz = pcz + dz
        if (this.chunks.has(this.key(cx, cz))) continue
        const dist = dx * dx + dz * dz
        list.push({ cx, cz, dist })
      }
    }
    list.sort((a, b) => a.dist - b.dist)
    this.loadList = list
  }

  // 每帧调用：加载/卸载区块 + 处理重建队列
  update(playerX, playerZ) {
    const pcx = Math.floor(playerX / CHUNK_SIZE)
    const pcz = Math.floor(playerZ / CHUNK_SIZE)
    const rd = this.store.renderDistance

    // 玩家进入新区块时刷新加载列表
    if (pcx !== this.lastChunkX || pcz !== this.lastChunkZ) {
      this.lastChunkX = pcx
      this.lastChunkZ = pcz
      this.updateLoadList(pcx, pcz, rd)
    }

    // 每帧最多生成 2 个新区块
    let generated = 0
    while (this.loadList.length > 0 && generated < 2) {
      const item = this.loadList.shift()
      // 跳过已生成或已超出范围的
      if (this.chunks.has(this.key(item.cx, item.cz))) continue
      if (Math.abs(item.cx - pcx) > rd || Math.abs(item.cz - pcz) > rd) continue
      this.generateChunk(item.cx, item.cz)
      generated++
    }

    // 卸载远处区块（Chebyshev 距离 > rd+1）
    this.unloadDistant(pcx, pcz, rd)

    // 处理重建队列：每帧最多 2 个
    let built = 0
    while (this.buildQueue.length > 0 && built < 2) {
      const chunk = this.buildQueue.shift()
      if (chunk && this.chunks.has(this.key(chunk.cx, chunk.cz))) {
        this.buildMeshFor(chunk)
        chunk.dirty = false
        built++
      }
    }
  }

  // 卸载远处区块
  unloadDistant(pcx, pcz, rd) {
    const limit = rd + 1
    const toRemove = []
    for (const [k, chunk] of this.chunks) {
      const dx = Math.abs(chunk.cx - pcx)
      const dz = Math.abs(chunk.cz - pcz)
      if (dx > limit || dz > limit) {
        toRemove.push(k)
      }
    }
    for (const k of toRemove) {
      const chunk = this.chunks.get(k)
      this.disposeChunkMeshes(chunk)
      this.chunks.delete(k)
    }
  }

  // 释放区块网格资源
  disposeChunkMeshes(chunk) {
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh)
      chunk.mesh.geometry.dispose()
      chunk.mesh = null
    }
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh)
      chunk.transparentMesh.geometry.dispose()
      chunk.transparentMesh = null
    }
  }

  // 为区块构建/更新网格
  buildMeshFor(chunk) {
    const { opaque, transparent } = chunk.buildMesh(this.getBlock.bind(this))

    // 处理 opaque 网格
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh)
      chunk.mesh.geometry.dispose()
      chunk.mesh = null
    }
    if (opaque) {
      const mesh = new THREE.Mesh(opaque, this.material)
      mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE)
      mesh.frustumCulled = true
      this.scene.add(mesh)
      chunk.mesh = mesh
    }

    // 处理 transparent 网格
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh)
      chunk.transparentMesh.geometry.dispose()
      chunk.transparentMesh = null
    }
    if (transparent) {
      const mesh = new THREE.Mesh(transparent, this.transparentMaterial)
      mesh.position.set(chunk.cx * CHUNK_SIZE, 0, chunk.cz * CHUNK_SIZE)
      mesh.frustumCulled = true
      this.scene.add(mesh)
      chunk.transparentMesh = mesh
    }
  }

  // 生成单个区块（地形 + 入队重建）
  generateChunk(cx, cz) {
    const chunk = new Chunk(cx, cz)
    this.terrain.generate(chunk)
    chunk.generated = true
    this.chunks.set(this.key(cx, cz), chunk)
    this.enqueueRebuild(chunk)
    // 标记已存在的邻居为 dirty（使其重算与新区块接壤的面）
    this.markDirty(cx - 1, cz)
    this.markDirty(cx + 1, cz)
    this.markDirty(cx, cz - 1)
    this.markDirty(cx, cz + 1)
    return chunk
  }

  // 释放所有资源
  dispose() {
    for (const [, chunk] of this.chunks) {
      this.disposeChunkMeshes(chunk)
    }
    this.chunks.clear()
    if (this.material) {
      this.material.dispose()
      this.material = null
    }
    if (this.transparentMaterial) {
      this.transparentMaterial.dispose()
      this.transparentMaterial = null
    }
    this.buildQueue = []
    this.loadList = []
  }
}
