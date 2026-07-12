import * as THREE from 'three'
import { World } from './World.js'
import { TerrainGenerator } from './TerrainGenerator.js'
import { TextureAtlas } from './TextureAtlas.js'
import { ChunkMeshBuilder } from './ChunkMeshBuilder.js'
import { CHUNK_SIZE } from './Chunk.js'
import { PhysicsSystem } from './PhysicsSystem.js'
import { PlayerController } from './PlayerController.js'
import { RaycastSystem } from './RaycastSystem.js'
import { BlockInteraction } from './BlockInteraction.js'
import { DayNightCycle } from './DayNightCycle.js'

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = null
    this.camera = null
    this.renderer = null
    this.animationId = null
    this.isRunning = false
    
    this.world = new World()
    this.terrainGenerator = new TerrainGenerator(12345)
    this.textureAtlas = new TextureAtlas()
    
    this.renderDistance = 4 // 渲染距离（区块数）
    
    // 物理系统和玩家控制器
    this.physicsSystem = null
    this.playerController = null
    this.raycastSystem = null
    this.blockInteraction = null
    this.dayNightCycle = null
    
    // 时间控制
    this.lastTime = 0
    this.lastChunkUpdate = 0
    this.lastDebugUpdate = 0
    this.cachedBlockCount = 0
    
    this.init()
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // 天空蓝色

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1, // Near
      1000 // Far
    )
    this.camera.position.set(0, 50, 0)

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    // 窗口大小调整
    window.addEventListener('resize', () => this.onWindowResize())

    // 加载世界数据
    this.world.load()
    
    // 初始化物理系统和玩家控制器
    this.physicsSystem = new PhysicsSystem(this.world)
    this.playerController = new PlayerController(this.camera, this.canvas, this.physicsSystem)
    
    // 初始化射线检测系统
    this.raycastSystem = new RaycastSystem(this.camera, this.world)
    
    // 初始化方块交互系统
    this.blockInteraction = new BlockInteraction(this.camera, this.world, this.raycastSystem, this.scene)
    
    // 初始化昼夜循环系统（会自动添加光照到场景）
    this.dayNightCycle = new DayNightCycle(this.scene)
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    
    // 生成初始区块
    this.generateInitialChunks()
    
    // 设置玩家出生点（在地形上方）
    const spawnHeight = this.terrainGenerator.getHeight(0, 0) + 3
    this.camera.position.set(0, spawnHeight, 0)
    
    this.lastTime = performance.now()
    this.animate()
  }

  generateInitialChunks() {
    const playerChunkX = Math.floor(this.camera.position.x / CHUNK_SIZE)
    const playerChunkZ = Math.floor(this.camera.position.z / CHUNK_SIZE)

    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX = playerChunkX + x
        const chunkZ = playerChunkZ + z
        this.generateChunk(chunkX, chunkZ)
      }
    }
  }

  generateChunk(chunkX, chunkZ) {
    const chunk = this.world.getOrCreateChunk(chunkX, chunkZ)
    
    // 如果区块未被修改过，生成地形
    if (!chunk.isModified) {
      this.terrainGenerator.generateChunk(chunk)
      chunk.isDirty = true
    }
    
    // 构建网格
    this.buildChunkMesh(chunk)
  }

  buildChunkMesh(chunk) {
    // 移除旧网格
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh)
      chunk.mesh.geometry.dispose()
      chunk.mesh.material.dispose()
    }

    // 构建新网格
    const meshBuilder = new ChunkMeshBuilder(chunk, this.world, this.textureAtlas)
    const mesh = meshBuilder.buildMesh()
    
    if (mesh) {
      chunk.mesh = mesh
      this.scene.add(mesh)
    }
    
    chunk.isDirty = false
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    // 保存世界
    this.world.save()
    
    // 清理网格
    for (const chunk of this.world.chunks.values()) {
      if (chunk.mesh) {
        chunk.mesh.geometry.dispose()
        chunk.mesh.material.dispose()
      }
    }
    
    this.renderer.dispose()
  }

  animate() {
    if (!this.isRunning) return

    this.animationId = requestAnimationFrame(() => this.animate())
    
    // 计算 deltaTime
    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) // 限制最大 deltaTime
    this.lastTime = currentTime
    
    // 更新玩家控制器
    this.playerController.update(deltaTime)
    
    // 更新方块交互（破坏进度、粒子等）
    if (this.blockInteraction) {
      this.blockInteraction.update(deltaTime)
    }
    
    // 更新昼夜循环
    this.dayNightCycle.update(deltaTime)
    
    // 更新区块加载（每 500ms 检查一次）
    if (currentTime - this.lastChunkUpdate > 500) {
      this.updateChunkLoading()
      this.lastChunkUpdate = currentTime
    }
    
    // 重建脏区块
    this.rebuildDirtyChunks()
    
    // 更新调试信息（每秒更新一次）
    if (currentTime - this.lastDebugUpdate > 1000) {
      this.updateDebugInfo()
      this.lastDebugUpdate = currentTime
    }
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera)
  }
  
  // 更新区块加载（动态加载/卸载）- 异步版本
  updateChunkLoading() {
    const playerChunkX = Math.floor(this.camera.position.x / CHUNK_SIZE)
    const playerChunkZ = Math.floor(this.camera.position.z / CHUNK_SIZE)
    
    // 需要加载的区块
    const chunksToLoad = new Set()
    for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
      for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
        const chunkX = playerChunkX + x
        const chunkZ = playerChunkZ + z
        chunksToLoad.add(`${chunkX},${chunkZ}`)
      }
    }
    
    // 卸载远离玩家的区块（保留修改过的区块数据）
    for (const [key, chunk] of this.world.chunks.entries()) {
      if (!chunksToLoad.has(key)) {
        // 卸载网格
        if (chunk.mesh) {
          this.scene.remove(chunk.mesh)
          chunk.mesh.geometry.dispose()
          chunk.mesh.material.dispose()
          chunk.mesh = null
        }
        
        // 如果区块未被修改，从内存中删除
        if (!chunk.isModified) {
          this.world.chunks.delete(key)
        }
      }
    }
    
    // 异步加载新区块（每帧最多加载 2 个）
    let chunksGenerated = 0
    const maxChunksPerFrame = 2
    
    for (const key of chunksToLoad) {
      if (chunksGenerated >= maxChunksPerFrame) break
      
      if (!this.world.chunks.has(key)) {
        const [chunkX, chunkZ] = key.split(',').map(Number)
        
        // 使用 requestIdleCallback 异步生成
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            if (this.world.chunks.has(key)) return // 已被其他帧加载
            this.generateChunk(chunkX, chunkZ)
          })
        } else {
          // 降级为同步（每帧限制数量）
          this.generateChunk(chunkX, chunkZ)
          chunksGenerated++
        }
      }
    }
  }
  
  // 重建脏区块
  rebuildDirtyChunks() {
    for (const chunk of this.world.chunks.values()) {
      if (chunk.isDirty) {
        this.buildChunkMesh(chunk)
      }
    }
  }
  
  // 更新调试信息
  updateDebugInfo() {
    const debugInfo = {
      position: this.camera.position,
      chunks: this.world.chunks.size,
      blocks: this.cachedBlockCount
    }
    
    window.dispatchEvent(new CustomEvent('debugInfoUpdate', {
      detail: debugInfo
    }))
  }
  
  // 统计方块数量（仅统计非空气方块）- 优化版本
  countBlocks() {
    let count = 0
    for (const chunk of this.world.chunks.values()) {
      for (let y = 0; y < 256; y++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
          for (let x = 0; x < CHUNK_SIZE; x++) {
            if (chunk.getBlock(x, y, z) !== 0) {
              count++
            }
          }
        }
      }
    }
    this.cachedBlockCount = count
    return count
  }
}
