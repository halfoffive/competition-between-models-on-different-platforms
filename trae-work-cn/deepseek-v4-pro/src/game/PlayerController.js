import * as THREE from 'three'
import { BLOCK_TYPES } from './BlockTypes.js'

export class PlayerController {
  /**
   * @param {THREE.Camera} camera - Three.js 摄像机
   * @param {HTMLElement} domElement - 用于绑定事件的 DOM 元素
   * @param {ChunkManager} chunkManager - 区块管理器
   */
  constructor(camera, domElement, chunkManager) {
    this.camera = camera
    this.domElement = domElement
    this.chunkManager = chunkManager

    // 玩家位置
    this.position = new THREE.Vector3(0, 60, 0)
    this.velocity = new THREE.Vector3(0, 0, 0)

    // 旋转
    this.yaw = 0
    this.pitch = 0

    // 移动参数
    this.speed = 5
    this.jumpForce = 8
    this.gravity = 20
    this.height = 1.6
    this.playerWidth = 0.6
    this.playerHalfWidth = this.playerWidth / 2

    // 输入状态
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
    }
    this._isPointerLocked = false
    this._mouseSensitivity = 0.002

    // 方块选择回调
    this.onBlockSelect = null      // (delta) => void
    this.onDigitSelect = null      // (index) => void

    // 地面状态
    this.isOnGround = false

    // 绑定方法引用，用于清理事件
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onPointerLockChange = this._onPointerLockChange.bind(this)
    this._onWheel = this._onWheel.bind(this)
    this._onClick = this._onClick.bind(this)
  }

  /**
   * 初始化控制器，绑定事件
   */
  init() {
    // 键盘事件
    document.addEventListener('keydown', this._onKeyDown)
    document.addEventListener('keyup', this._onKeyUp)

    // 鼠标事件（PointerLock）
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('pointerlockchange', this._onPointerLockChange)

    // 点击锁定鼠标
    this.domElement.addEventListener('click', this._onClick)

    // 滚轮切换方块
    document.addEventListener('wheel', this._onWheel, { passive: false })

    // 初始化摄像机位置
    this.camera.position.copy(this.position)
    this.camera.position.y += this.height / 2
  }

  /**
   * 键盘按下
   */
  _onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this._keys.forward = true
        break
      case 'KeyS':
      case 'ArrowDown':
        this._keys.backward = true
        break
      case 'KeyA':
      case 'ArrowLeft':
        this._keys.left = true
        break
      case 'KeyD':
      case 'ArrowRight':
        this._keys.right = true
        break
      case 'Space':
        this._keys.jump = true
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this._keys.sprint = true
        break
      default:
        break
    }

    // 数字键切换方块
    if (event.code >= 'Digit1' && event.code <= 'Digit8') {
      const index = parseInt(event.code.replace('Digit', '')) - 1
      if (this.onDigitSelect) {
        this.onDigitSelect(index)
      }
    }
  }

  /**
   * 键盘松开
   */
  _onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this._keys.forward = false
        break
      case 'KeyS':
      case 'ArrowDown':
        this._keys.backward = false
        break
      case 'KeyA':
      case 'ArrowLeft':
        this._keys.left = false
        break
      case 'KeyD':
      case 'ArrowRight':
        this._keys.right = false
        break
      case 'Space':
        this._keys.jump = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this._keys.sprint = false
        break
      default:
        break
    }
  }

  /**
   * 鼠标移动（PointerLock 模式下）
   */
  _onMouseMove(event) {
    if (!this._isPointerLocked) return

    this.yaw -= event.movementX * this._mouseSensitivity
    this.pitch -= event.movementY * this._mouseSensitivity

    // 限制俯仰角度
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch))
  }

  /**
   * PointerLock 状态变化
   */
  _onPointerLockChange() {
    this._isPointerLocked =
      document.pointerLockElement === this.domElement
  }

  /**
   * 点击事件 - 锁定鼠标
   */
  _onClick() {
    if (!this._isPointerLocked) {
      this.domElement.requestPointerLock()
    }
  }

  /**
   * 滚轮事件 - 切换方块
   */
  _onWheel(event) {
    event.preventDefault()
    if (this.onBlockSelect) {
      this.onBlockSelect(Math.sign(event.deltaY))
    }
  }

  /**
   * 每帧更新
   * @param {number} deltaTime - 帧间隔时间（秒）
   */
  update(deltaTime) {
    if (!this._isPointerLocked) return

    // 限制 deltaTime 防止大帧跳跃
    const dt = Math.min(deltaTime, 0.1)

    // 1. 更新摄像机旋转
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ')
    this.camera.quaternion.setFromEuler(euler)

    // 2. 计算移动方向
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, 0))
    )
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, this.yaw, 0))
    )

    const moveDir = new THREE.Vector3(0, 0, 0)
    if (this._keys.forward) moveDir.add(forward)
    if (this._keys.backward) moveDir.sub(forward)
    if (this._keys.left) moveDir.sub(right)
    if (this._keys.right) moveDir.add(right)

    // 归一化水平移动方向
    if (moveDir.length() > 0) {
      moveDir.normalize()
    }

    // 3. 应用重力
    this.velocity.y -= this.gravity * dt

    // 4. 跳跃
    if (this._keys.jump && this.isOnGround) {
      this.velocity.y = this.jumpForce
      this.isOnGround = false
    }

    // 5. 计算目标速度
    const currentSpeed = this._keys.sprint ? this.speed * 1.5 : this.speed
    const targetVelocityX = moveDir.x * currentSpeed
    const targetVelocityZ = moveDir.z * currentSpeed

    // 6. 碰撞检测与响应
    const newPos = new THREE.Vector3(
      this.position.x + targetVelocityX * dt,
      this.position.y + this.velocity.y * dt,
      this.position.z + targetVelocityZ * dt
    )

    const adjustedPos = this._checkCollision(newPos)

    this.position.copy(adjustedPos)

    // 更新速度（用于下一帧）
    // 如果碰撞阻止了移动，清零对应方向的速度
    if (adjustedPos.y !== newPos.y) {
      this.velocity.y = 0
    }

    // 7. 更新摄像机位置
    this.camera.position.set(
      this.position.x,
      this.position.y + this.height * 0.8,
      this.position.z
    )

    // 8. 检测是否在地面
    this._checkGrounded()
  }

  /**
   * 碰撞检测与响应
   * 检测玩家 AABB 与方块的碰撞，实现滑动效果
   * @param {THREE.Vector3} newPos - 期望的新位置
   * @returns {THREE.Vector3} 碰撞调整后的位置
   */
  _checkCollision(newPos) {
    const result = newPos.clone()

    const halfW = this.playerHalfWidth
    const halfH = this.height / 2

    // 玩家 AABB 范围
    const minX = result.x - halfW
    const maxX = result.x + halfW
    const minY = result.y - halfH
    const maxY = result.y + halfH
    const minZ = result.z - halfW
    const maxZ = result.z + halfW

    // 检查碰撞的方块范围
    const bx0 = Math.floor(minX)
    const bx1 = Math.floor(maxX)
    const by0 = Math.floor(minY)
    const by1 = Math.floor(maxY)
    const bz0 = Math.floor(minZ)
    const bz1 = Math.floor(maxZ)

    let collidesX = false
    let collidesY = false
    let collidesZ = false

    for (let bx = bx0; bx <= bx1; bx++) {
      for (let by = by0; by <= by1; by++) {
        for (let bz = bz0; bz <= bz1; bz++) {
          const blockType = this.chunkManager.getBlock(bx, by, bz)
          if (blockType === BLOCK_TYPES.AIR || blockType === BLOCK_TYPES.WATER) continue

          // 方块 AABB
          const blockMinX = bx
          const blockMaxX = bx + 1
          const blockMinY = by
          const blockMaxY = by + 1
          const blockMinZ = bz
          const blockMaxZ = bz + 1

          // 检查重叠
          if (
            maxX > blockMinX && minX < blockMaxX &&
            maxY > blockMinY && minY < blockMaxY &&
            maxZ > blockMinZ && minZ < blockMaxZ
          ) {
            // 计算各轴的重叠量
            const overlapX = maxX > blockMinX && minX < blockMaxX
              ? Math.min(maxX - blockMinX, blockMaxX - minX) : 0
            const overlapY = maxY > blockMinY && minY < blockMaxY
              ? Math.min(maxY - blockMinY, blockMaxY - minY) : 0
            const overlapZ = maxZ > blockMinZ && minZ < blockMaxZ
              ? Math.min(maxZ - blockMinZ, blockMaxZ - minZ) : 0

            // 选择最小重叠轴进行修正
            if (overlapX <= overlapY && overlapX <= overlapZ) {
              collidesX = true
            } else if (overlapY <= overlapX && overlapY <= overlapZ) {
              collidesY = true
            } else {
              collidesZ = true
            }
          }
        }
      }
    }

    // 分别处理各轴碰撞（允许沿墙滑动）
    if (collidesX) {
      result.x = this.position.x
    }
    if (collidesY) {
      result.y = this.position.y
      this.velocity.y = 0
    }
    if (collidesZ) {
      result.z = this.position.z
    }

    return result
  }

  /**
   * 检测是否在地面
   */
  _checkGrounded() {
    const footY = this.position.y - this.height / 2
    const checkY = footY - 0.01

    const minX = this.position.x - this.playerHalfWidth
    const maxX = this.position.x + this.playerHalfWidth
    const minZ = this.position.z - this.playerHalfWidth
    const maxZ = this.position.z + this.playerHalfWidth

    this.isOnGround = false

    for (let bx = Math.floor(minX); bx <= Math.floor(maxX); bx++) {
      for (let bz = Math.floor(minZ); bz <= Math.floor(maxZ); bz++) {
        const blockType = this.chunkManager.getBlock(bx, Math.floor(checkY), bz)
        if (blockType !== BLOCK_TYPES.AIR && blockType !== BLOCK_TYPES.WATER) {
          this.isOnGround = true
          return
        }
      }
    }
  }

  /**
   * 清理事件监听
   */
  dispose() {
    document.removeEventListener('keydown', this._onKeyDown)
    document.removeEventListener('keyup', this._onKeyUp)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('pointerlockchange', this._onPointerLockChange)
    document.removeEventListener('wheel', this._onWheel)
    this.domElement.removeEventListener('click', this._onClick)

    // 退出 pointer lock
    if (this._isPointerLocked) {
      document.exitPointerLock()
    }
  }
}