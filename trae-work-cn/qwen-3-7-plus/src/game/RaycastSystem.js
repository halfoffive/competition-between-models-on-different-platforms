import * as THREE from 'three'
import { BlockType, BlockData } from './Block.js'

export class RaycastSystem {
  constructor(camera, world) {
    this.camera = camera
    this.world = world
    this.raycaster = new THREE.Raycaster()
    this.maxDistance = 5 // 最大交互距离
  }

  // 从相机中心发射射线
  castRay() {
    // 获取相机朝向
    const direction = new THREE.Vector3()
    this.camera.getWorldDirection(direction)
    
    // 设置射线
    this.raycaster.set(this.camera.position, direction)
    this.raycaster.far = this.maxDistance

    // 步进式射线检测（DDA算法）
    return this.stepRaycast(this.camera.position, direction)
  }

  // 步进式射线检测
  stepRaycast(origin, direction) {
    const step = 0.1 // 步进大小
    const maxSteps = this.maxDistance / step
    
    const pos = origin.clone()
    const prevPos = origin.clone()
    
    for (let i = 0; i < maxSteps; i++) {
      prevPos.copy(pos)
      
      // 前进一个步长
      pos.x += direction.x * step
      pos.y += direction.y * step
      pos.z += direction.z * step
      
      // 检查当前位置的方块
      const blockX = Math.floor(pos.x)
      const blockY = Math.floor(pos.y)
      const blockZ = Math.floor(pos.z)
      
      const block = this.world.getBlock(blockX, blockY, blockZ)
      
      if (block !== BlockType.AIR && BlockData[block] && BlockData[block].solid) {
        // 计算法向量（通过检查哪个面被击中）
        const normal = this.calculateNormal(prevPos, blockX, blockY, blockZ)
        
        return {
          hit: true,
          block: { x: blockX, y: blockY, z: blockZ },
          normal: normal,
          distance: origin.distanceTo(pos)
        }
      }
    }
    
    return { hit: false }
  }

  // 计算法向量
  calculateNormal(prevPos, blockX, blockY, blockZ) {
    // 检查从哪个方向进入方块
    const dx = prevPos.x - (blockX + 0.5)
    const dy = prevPos.y - (blockY + 0.5)
    const dz = prevPos.z - (blockZ + 0.5)
    
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const absDz = Math.abs(dz)
    
    // 返回最大分量对应的法向量
    if (absDx > absDy && absDx > absDz) {
      return { x: dx > 0 ? 1 : -1, y: 0, z: 0 }
    } else if (absDy > absDx && absDy > absDz) {
      return { x: 0, y: dy > 0 ? 1 : -1, z: 0 }
    } else {
      return { x: 0, y: 0, z: dz > 0 ? 1 : -1 }
    }
  }

  // 获取准星指向的方块
  getTargetBlock() {
    const result = this.castRay()
    if (result.hit) {
      return result.block
    }
    return null
  }

  // 获取放置位置（目标方块的相邻位置）
  getPlacementPosition() {
    const result = this.castRay()
    if (result.hit) {
      return {
        x: result.block.x + result.normal.x,
        y: result.block.y + result.normal.y,
        z: result.block.z + result.normal.z
      }
    }
    return null
  }
}
