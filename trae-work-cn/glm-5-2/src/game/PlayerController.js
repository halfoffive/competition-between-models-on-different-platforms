import * as THREE from 'three'
import { BLOCK, isSolid } from './blocks.js'
import { CHUNK_HEIGHT } from './Chunk.js'

// 第一人称玩家控制器
// 负责视角旋转、WASD 移动、跳跃/飞行物理、AABB 碰撞、方块破坏与放置
export class PlayerController {
  constructor(camera, domElement, world, store) {
    this.camera = camera
    this.domElement = domElement
    this.world = world
    this.store = store

    // 位置（脚部位置）与速度
    this.position = new THREE.Vector3(store.playerPos.x, store.playerPos.y, store.playerPos.z)
    this.velocity = new THREE.Vector3()

    // 视角
    this.yaw = 0
    this.pitch = 0
    this.locked = false

    // 状态
    this.onGround = false
    this.flying = false
    this.keys = {}
    this.lastSpaceTime = 0

    // 玩家尺寸
    this.halfWidth = 0.3 // 宽 0.6
    this.height = 1.8
    this.eyeHeight = 1.62

    // 物理参数
    this.speed = 4.3
    this.sprintSpeed = 6.5
    this.flySpeed = 10
    this.jumpSpeed = 8
    this.gravity = 25

    // 出生点调整：若卡在地形内部，向上移动至无碰撞位置（需在尺寸定义之后）
    while (this.collides() && this.position.y < CHUNK_HEIGHT - 2) {
      this.position.y += 1
    }

    // 高亮线框：标记当前目视方块
    this.highlight = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
      new THREE.LineBasicMaterial({ color: 0x000000 })
    )
    this.highlight.visible = false
    this.world.scene.add(this.highlight)

    // 绑定事件监听（用箭头函数保存引用，便于 dispose 时移除）
    this._onPointerLockChange = () => {
      this.locked = document.pointerLockElement === this.domElement
      // 指针锁被释放（如按 ESC）时，若处于游戏中且未打开物品栏，则自动暂停
      if (
        !this.locked &&
        this.store.screen === 'game' &&
        !this.store.inventoryOpen &&
        this.store.running
      ) {
        this.store.requestPause()
      }
    }
    this._onMouseMove = (e) => {
      if (!this.locked) return
      this.yaw -= e.movementX * 0.0025
      this.pitch -= e.movementY * 0.0025
      const limit = Math.PI / 2 - 0.01
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
    }
    this._onKeyDown = (e) => {
      this.keys[e.code] = true
      switch (e.code) {
        case 'Space': {
          // 双击空格切换飞行（忽略按键重复）
          if (!e.repeat) {
            const now = performance.now()
            if (now - this.lastSpaceTime < 300) {
              this.flying = !this.flying
              this.velocity.set(0, 0, 0)
            }
            this.lastSpaceTime = now
          }
          break
        }
        case 'KeyE':
          // 忽略按键重复，避免长按 E 反复开关；暂停时不允许打开物品栏
          if (!e.repeat && !this.store.paused) {
            this.store.toggleInventory()
            if (this.store.inventoryOpen) document.exitPointerLock()
          }
          break
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          this.store.setSelectedSlot(parseInt(e.code.slice(5), 10) - 1)
          break
        default:
          break
      }
    }
    this._onKeyUp = (e) => {
      this.keys[e.code] = false
    }
    this._onMouseDown = (e) => {
      if (!this.locked || this.store.paused || this.store.inventoryOpen) return
      if (e.button === 0) this.handleLeftClick()
      else if (e.button === 2) this.handleRightClick()
    }
    this._onContextMenu = (e) => {
      e.preventDefault()
    }
    this._onWheel = (e) => {
      if (!this.locked) return
      let s = this.store.selectedSlot + (e.deltaY > 0 ? 1 : -1)
      s = ((s % 9) + 9) % 9
      this.store.setSelectedSlot(s)
    }

    document.addEventListener('pointerlockchange', this._onPointerLockChange)
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('keydown', this._onKeyDown)
    document.addEventListener('keyup', this._onKeyUp)
    this.domElement.addEventListener('mousedown', this._onMouseDown)
    this.domElement.addEventListener('contextmenu', this._onContextMenu)
    this.domElement.addEventListener('wheel', this._onWheel)
  }

  // 每帧更新：输入 -> 物理 -> 碰撞 -> 相机 -> 高亮
  update(delta) {
    // clamp delta 防止切屏后大跳跃
    if (delta > 0.1) delta = 0.1
    // 仅在游戏运行且未暂停/未开背包时执行物理
    if (this.store.screen !== 'game' || this.store.paused || this.store.inventoryOpen) return

    // 1. 计算水平输入方向（基于 yaw）
    const forward = (this.keys['KeyW'] ? 1 : 0) - (this.keys['KeyS'] ? 1 : 0)
    const strafe = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0)
    let dirX = -Math.sin(this.yaw) * forward + Math.cos(this.yaw) * strafe
    let dirZ = -Math.cos(this.yaw) * forward - Math.sin(this.yaw) * strafe
    const len = Math.hypot(dirX, dirZ)
    if (len > 0) {
      dirX /= len
      dirZ /= len
    }

    // 2. 速度选择
    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight']
    let speed
    if (this.flying) speed = this.flySpeed
    else if (sprint) speed = this.sprintSpeed
    else speed = this.speed

    // 3. 水平速度
    this.velocity.x = dirX * speed
    this.velocity.z = dirZ * speed

    // 4. 垂直速度
    if (this.flying) {
      this.velocity.y = ((this.keys['Space'] ? 1 : 0) - (sprint ? 1 : 0)) * this.flySpeed
    } else {
      this.velocity.y -= this.gravity * delta
      if (this.keys['Space'] && this.onGround) {
        this.velocity.y = this.jumpSpeed
        this.onGround = false
      }
    }

    // 5. 逐轴碰撞移动
    this.moveAxis('x', this.velocity.x * delta)
    this.moveAxis('y', this.velocity.y * delta)
    this.moveAxis('z', this.velocity.z * delta)

    // 7. 防止掉出世界
    if (this.position.y < -50) {
      this.position.y = -50
      this.velocity.y = 0
    }

    // 8. 更新相机
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z)
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ')

    // 9. 更新 store 玩家位置与朝向
    this.store.setPlayerPos({ x: this.position.x, y: this.position.y, z: this.position.z })
    this.store.setYawPitch(this.yaw, this.pitch)

    // 10. 更新高亮线框
    this.updateHighlight()
  }

  // 单轴移动 + 碰撞解析
  moveAxis(axis, amount) {
    this.position[axis] += amount
    if (this.collides()) {
      this.position[axis] -= amount
      if (axis === 'y') {
        // 下落碰撞 = 着地
        if (amount < 0) this.onGround = true
        this.velocity.y = 0
      }
    } else if (axis === 'y') {
      // y 方向无碰撞（上升或下落未触地）均视为离地
      this.onGround = false
    }
  }

  // 玩家 AABB 是否与实体方块相交
  collides() {
    const minX = this.position.x - this.halfWidth
    const minY = this.position.y
    const minZ = this.position.z - this.halfWidth
    const maxX = this.position.x + this.halfWidth
    const maxY = this.position.y + this.height
    const maxZ = this.position.z + this.halfWidth
    for (let bx = Math.floor(minX); bx <= Math.floor(maxX); bx++) {
      for (let by = Math.floor(minY); by <= Math.floor(maxY); by++) {
        for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ); bz++) {
          if (isSolid(this.world.getBlock(bx, by, bz))) return true
        }
      }
    }
    return false
  }

  // DDA 体素射线遍历，返回命中方块坐标与邻接面法线，否则 null
  raycast(maxDistance = 5) {
    const origin = this.camera.position
    const cp = Math.cos(this.pitch)
    const sp = Math.sin(this.pitch)
    const sy = Math.sin(this.yaw)
    const cy = Math.cos(this.yaw)
    // 相机朝向（局部 -Z 经 YXZ 旋转后的世界向量），已为单位向量
    const dirX = -sy * cp
    const dirY = sp
    const dirZ = -cy * cp

    let x = Math.floor(origin.x)
    let y = Math.floor(origin.y)
    let z = Math.floor(origin.z)

    const stepX = dirX > 0 ? 1 : dirX < 0 ? -1 : 0
    const stepY = dirY > 0 ? 1 : dirY < 0 ? -1 : 0
    const stepZ = dirZ > 0 ? 1 : dirZ < 0 ? -1 : 0

    // 到下一个体素边界的射线参数
    let tMaxX = stepX !== 0 ? (stepX > 0 ? x + 1 - origin.x : origin.x - x) / Math.abs(dirX) : Infinity
    let tMaxY = stepY !== 0 ? (stepY > 0 ? y + 1 - origin.y : origin.y - y) / Math.abs(dirY) : Infinity
    let tMaxZ = stepZ !== 0 ? (stepZ > 0 ? z + 1 - origin.z : origin.z - z) / Math.abs(dirZ) : Infinity
    const tDeltaX = stepX !== 0 ? 1 / Math.abs(dirX) : Infinity
    const tDeltaY = stepY !== 0 ? 1 / Math.abs(dirY) : Infinity
    const tDeltaZ = stepZ !== 0 ? 1 / Math.abs(dirZ) : Infinity

    let nx = 0
    let ny = 0
    let nz = 0
    let t = 0

    while (t <= maxDistance) {
      const b = this.world.getBlock(x, y, z)
      if (isSolid(b)) {
        return { x, y, z, nx, ny, nz }
      }
      // 步进到下一体素
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        x += stepX
        t = tMaxX
        tMaxX += tDeltaX
        nx = -stepX
        ny = 0
        nz = 0
      } else if (tMaxY < tMaxZ) {
        y += stepY
        t = tMaxY
        tMaxY += tDeltaY
        nx = 0
        ny = -stepY
        nz = 0
      } else {
        z += stepZ
        t = tMaxZ
        tMaxZ += tDeltaZ
        nx = 0
        ny = 0
        nz = -stepZ
      }
    }
    return null
  }

  // 左键：破坏目标方块（基岩不可破坏）
  handleLeftClick() {
    const hit = this.raycast(5)
    if (!hit) return
    const b = this.world.getBlock(hit.x, hit.y, hit.z)
    if (b !== BLOCK.BEDROCK) {
      this.world.setBlock(hit.x, hit.y, hit.z, BLOCK.AIR)
    }
  }

  // 右键：在命中面邻接位置放置当前快捷栏方块
  handleRightClick() {
    const hit = this.raycast(5)
    if (!hit) return
    const px = hit.x + hit.nx
    const py = hit.y + hit.ny
    const pz = hit.z + hit.nz
    // 不能放置在玩家身体内
    if (!this.boxIntersectsBlock(px, py, pz)) {
      const blockId = this.store.hotbar[this.store.selectedSlot]
      this.world.setBlock(px, py, pz, blockId)
    }
  }

  // 指定方块是否与玩家 AABB 相交
  boxIntersectsBlock(bx, by, bz) {
    const minX = this.position.x - this.halfWidth
    const minY = this.position.y
    const minZ = this.position.z - this.halfWidth
    const maxX = this.position.x + this.halfWidth
    const maxY = this.position.y + this.height
    const maxZ = this.position.z + this.halfWidth
    // 方块占据 [bx, bx+1) x [by, by+1) x [bz, bz+1)
    return (
      bx + 1 > minX && bx < maxX &&
      by + 1 > minY && by < maxY &&
      bz + 1 > minZ && bz < maxZ
    )
  }

  // 更新高亮线框位置
  updateHighlight() {
    const hit = this.raycast(5)
    if (hit) {
      this.highlight.visible = true
      this.highlight.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5)
    } else {
      this.highlight.visible = false
    }
  }

  // 释放资源：移除事件监听与高亮
  dispose() {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('keydown', this._onKeyDown)
    document.removeEventListener('keyup', this._onKeyUp)
    this.domElement.removeEventListener('mousedown', this._onMouseDown)
    this.domElement.removeEventListener('contextmenu', this._onContextMenu)
    this.domElement.removeEventListener('wheel', this._onWheel)
    this.world.scene.remove(this.highlight)
    this.highlight.geometry.dispose()
    this.highlight.material.dispose()
  }
}
