import * as THREE from 'three'
import { BlockType, BlockData } from './Block.js'

// 方块颜色映射（用于粒子效果）
const BLOCK_COLORS = {
  [BlockType.GRASS]: 0x4a7c4e,
  [BlockType.DIRT]: 0x8b6f47,
  [BlockType.STONE]: 0x808080,
  [BlockType.WOOD]: 0x8b5a2b,
  [BlockType.LEAVES]: 0x2d5a2d,
  [BlockType.SAND]: 0xd4b895,
  [BlockType.WATER]: 0x3264c8,
  [BlockType.COAL_ORE]: 0x3a3a3a,
  [BlockType.IRON_ORE]: 0xd4a574,
  [BlockType.DIAMOND_ORE]: 0x5ee8e0,
  [BlockType.BEDROCK]: 0x333333,
  [BlockType.PLANKS]: 0xb8864f,
  [BlockType.COBBLESTONE]: 0x6b6b6b,
  [BlockType.GLASS]: 0xc8e6ff
}

export class BlockInteraction {
  constructor(camera, world, raycastSystem, scene) {
    this.camera = camera
    this.world = world
    this.raycastSystem = raycastSystem
    this.scene = scene
    
    // 当前选中的方块类型
    this.selectedBlockType = BlockType.GRASS
    
    // 方块选择列表
    this.blockTypes = [
      BlockType.GRASS,
      BlockType.DIRT,
      BlockType.STONE,
      BlockType.WOOD,
      BlockType.LEAVES,
      BlockType.SAND,
      BlockType.COBBLESTONE,
      BlockType.PLANKS,
      BlockType.GLASS
    ]
    
    // 破坏进度系统
    this.isBreaking = false
    this.breakProgress = 0 // 0-1
    this.breakTarget = null // { x, y, z }
    this.breakSpeed = 0.5 // 每秒破坏进度
    
    // 粒子系统
    this.particles = []
    
    // 破坏进度覆盖层
    this.breakOverlay = null
    this.createBreakOverlay()
    
    this.setupEventListeners()
  }
  
  createBreakOverlay() {
    const geometry = new THREE.BoxGeometry(1.01, 1.01, 1.01)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      wireframe: true
    })
    this.breakOverlay = new THREE.Mesh(geometry, material)
    this.breakOverlay.visible = false
    if (this.scene) {
      this.scene.add(this.breakOverlay)
    }
  }

  setupEventListeners() {
    // 鼠标左键 - 开始/持续破坏方块
    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isBreaking = true
        this.breakProgress = 0
        this.breakTarget = null
      }
    })
    
    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isBreaking = false
        this.breakProgress = 0
        this.breakTarget = null
        if (this.breakOverlay) {
          this.breakOverlay.visible = false
        }
      }
    })

    // 鼠标右键 - 放置方块
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.placeBlock()
    })

    // 数字键 1-9 选择方块类型
    document.addEventListener('keydown', (e) => {
      const key = parseInt(e.key)
      if (key >= 1 && key <= 9) {
        this.selectBlockByIndex(key - 1)
      }
    })

    // 鼠标滚轮切换方块
    document.addEventListener('wheel', (e) => {
      const currentIndex = this.blockTypes.indexOf(this.selectedBlockType)
      let newIndex = currentIndex
      
      if (e.deltaY > 0) {
        newIndex = (currentIndex + 1) % this.blockTypes.length
      } else {
        newIndex = (currentIndex - 1 + this.blockTypes.length) % this.blockTypes.length
      }
      
      this.selectedBlockType = this.blockTypes[newIndex]
      
      window.dispatchEvent(new CustomEvent('blockTypeChanged', {
        detail: { blockType: this.selectedBlockType }
      }))
    })
    
    // 监听 Hotbar 的选择变更
    window.addEventListener('hotbarSelectionChanged', (e) => {
      const index = e.detail.index
      if (index >= 0 && index < this.blockTypes.length) {
        this.selectedBlockType = this.blockTypes[index]
      }
    })
  }

  selectBlockByIndex(index) {
    if (index >= 0 && index < this.blockTypes.length) {
      this.selectedBlockType = this.blockTypes[index]
      
      window.dispatchEvent(new CustomEvent('blockTypeChanged', {
        detail: { blockType: this.selectedBlockType }
      }))
    }
  }
  
  // 每帧更新（由 GameEngine 调用）
  update(deltaTime) {
    // 更新破坏进度
    if (this.isBreaking) {
      const target = this.raycastSystem.getTargetBlock()
      
      if (target) {
        // 如果目标变了，重置进度
        if (!this.breakTarget || 
            this.breakTarget.x !== target.x || 
            this.breakTarget.y !== target.y || 
            this.breakTarget.z !== target.z) {
          this.breakTarget = { ...target }
          this.breakProgress = 0
        }
        
        const block = this.world.getBlock(target.x, target.y, target.z)
        if (block !== BlockType.AIR && block !== BlockType.BEDROCK) {
          this.breakProgress += this.breakSpeed * deltaTime
          
          // 更新覆盖层
          if (this.breakOverlay) {
            this.breakOverlay.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5)
            this.breakOverlay.visible = true
            this.breakOverlay.material.opacity = this.breakProgress * 0.5
          }
          
          // 破坏完成
          if (this.breakProgress >= 1) {
            this.breakBlock(target)
            this.breakProgress = 0
            this.breakTarget = null
            if (this.breakOverlay) {
              this.breakOverlay.visible = false
            }
          }
        }
      } else {
        // 没有目标，重置
        this.breakProgress = 0
        this.breakTarget = null
        if (this.breakOverlay) {
          this.breakOverlay.visible = false
        }
      }
    }
    
    // 更新粒子
    this.updateParticles(deltaTime)
  }
  
  breakBlock(target) {
    if (!target) return
    
    const { x, y, z } = target
    
    const block = this.world.getBlock(x, y, z)
    if (block === BlockType.AIR || block === BlockType.BEDROCK) return

    // 生成粒子效果
    this.spawnBreakParticles(x, y, z, block)

    // 移除方块
    this.world.setBlock(x, y, z, BlockType.AIR)
    
    // 标记区块及相邻区块为脏数据
    this.markAffectedChunksDirty(x, y, z)
  }

  placeBlock() {
    const placement = this.raycastSystem.getPlacementPosition()
    if (!placement) return

    const { x, y, z } = placement
    
    // 检查是否在玩家位置
    const playerX = Math.floor(this.camera.position.x)
    const playerY = Math.floor(this.camera.position.y)
    const playerZ = Math.floor(this.camera.position.z)
    
    if (x === playerX && z === playerZ && (y === playerY || y === playerY - 1)) {
      return
    }

    const currentBlock = this.world.getBlock(x, y, z)
    if (currentBlock !== BlockType.AIR) return

    this.world.setBlock(x, y, z, this.selectedBlockType)
    this.markAffectedChunksDirty(x, y, z)
  }

  markAffectedChunksDirty(x, y, z) {
    const chunkX = Math.floor(x / 16)
    const chunkZ = Math.floor(z / 16)
    this.markChunkDirty(chunkX, chunkZ)
    
    const localX = ((x % 16) + 16) % 16
    const localZ = ((z % 16) + 16) % 16
    
    if (localX === 0) this.markChunkDirty(chunkX - 1, chunkZ)
    if (localX === 15) this.markChunkDirty(chunkX + 1, chunkZ)
    if (localZ === 0) this.markChunkDirty(chunkX, chunkZ - 1)
    if (localZ === 15) this.markChunkDirty(chunkX, chunkZ + 1)
  }

  markChunkDirty(chunkX, chunkZ) {
    const chunk = this.world.getChunk(chunkX, chunkZ)
    if (chunk) {
      chunk.isDirty = true
    }
  }
  
  // 粒子效果
  spawnBreakParticles(x, y, z, blockType) {
    if (!this.scene) return
    
    const color = BLOCK_COLORS[blockType] || 0x808080
    const particleCount = 8
    
    for (let i = 0; i < particleCount; i++) {
      const size = 0.1 + Math.random() * 0.1
      const geometry = new THREE.BoxGeometry(size, size, size)
      const material = new THREE.MeshBasicMaterial({ color })
      const mesh = new THREE.Mesh(geometry, material)
      
      mesh.position.set(
        x + 0.5 + (Math.random() - 0.5) * 0.5,
        y + 0.5 + (Math.random() - 0.5) * 0.5,
        z + 0.5 + (Math.random() - 0.5) * 0.5
      )
      
      this.scene.add(mesh)
      
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 4 + 1,
          (Math.random() - 0.5) * 3
        ),
        life: 1.0 // 1秒生命周期
      })
    }
  }
  
  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= deltaTime
      
      if (p.life <= 0) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        p.mesh.material.dispose()
        this.particles.splice(i, 1)
        continue
      }
      
      // 重力
      p.velocity.y -= 10 * deltaTime
      
      p.mesh.position.x += p.velocity.x * deltaTime
      p.mesh.position.y += p.velocity.y * deltaTime
      p.mesh.position.z += p.velocity.z * deltaTime
      
      // 淡出
      p.mesh.material.transparent = true
      p.mesh.material.opacity = p.life
    }
  }
  
  dispose() {
    // 清理粒子
    for (const p of this.particles) {
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
      p.mesh.material.dispose()
    }
    this.particles = []
    
    // 清理覆盖层
    if (this.breakOverlay) {
      this.scene.remove(this.breakOverlay)
      this.breakOverlay.geometry.dispose()
      this.breakOverlay.material.dispose()
    }
  }
}
