import * as THREE from 'three'
import { BlockType, BlockData } from './Block.js'

export class PhysicsSystem {
  constructor(world) {
    this.world = world
    
    // 玩家 AABB 尺寸
    this.playerWidth = 0.6
    this.playerHeight = 1.8
    this.playerEyeHeight = 1.62
    
    // 重力参数
    this.gravity = -20.0
    this.terminalVelocity = -50.0
  }
  
  // 获取玩家 AABB
  getPlayerAABB(position) {
    const halfWidth = this.playerWidth / 2
    return {
      minX: position.x - halfWidth,
      maxX: position.x + halfWidth,
      minY: position.y - this.playerEyeHeight,
      maxY: position.y + (this.playerHeight - this.playerEyeHeight),
      minZ: position.z - halfWidth,
      maxZ: position.z + halfWidth
    }
  }
  
  // 检查方块是否固体
  isBlockSolid(x, y, z) {
    const block = this.world.getBlock(x, y, z)
    const blockData = BlockData[block]
    return blockData && blockData.solid
  }
  
  // 检查 AABB 是否与固体方块碰撞
  checkCollision(aabb) {
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX)
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ)
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (this.isBlockSolid(x, y, z)) {
            return true
          }
        }
      }
    }
    
    return false
  }
  
  // 执行碰撞检测与响应
  // 返回: { collision: boolean, normalX: number, normalY: number, normalZ: number }
  moveAndCollide(position, velocity, deltaTime) {
    const result = {
      collision: false,
      normalX: 0,
      normalY: 0,
      normalZ: 0,
      grounded: false
    }
    
    // 分轴处理碰撞（X/Y/Z 分离）
    
    // X 轴
    const newX = position.x + velocity.x * deltaTime
    const testPos1 = new THREE.Vector3(newX, position.y, position.z)
    const aabb1 = this.getPlayerAABB(testPos1)
    
    if (this.checkCollision(aabb1)) {
      result.collision = true
      result.normalX = velocity.x > 0 ? -1 : 1
      velocity.x = 0
    } else {
      position.x = newX
    }
    
    // Y 轴
    const newY = position.y + velocity.y * deltaTime
    const testPos2 = new THREE.Vector3(position.x, newY, position.z)
    const aabb2 = this.getPlayerAABB(testPos2)
    
    if (this.checkCollision(aabb2)) {
      result.collision = true
      result.normalY = velocity.y > 0 ? -1 : 1
      velocity.y = 0
      
      if (result.normalY > 0) {
        result.grounded = true
      }
    } else {
      position.y = newY
    }
    
    // Z 轴
    const newZ = position.z + velocity.z * deltaTime
    const testPos3 = new THREE.Vector3(position.x, position.y, newZ)
    const aabb3 = this.getPlayerAABB(testPos3)
    
    if (this.checkCollision(aabb3)) {
      result.collision = true
      result.normalZ = velocity.z > 0 ? -1 : 1
      velocity.z = 0
    } else {
      position.z = newZ
    }
    
    return result
  }
  
  // 应用重力
  applyGravity(velocity, deltaTime) {
    velocity.y += this.gravity * deltaTime
    velocity.y = Math.max(velocity.y, this.terminalVelocity)
  }
}
