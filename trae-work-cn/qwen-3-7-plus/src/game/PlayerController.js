import * as THREE from 'three'

export class PlayerController {
  constructor(camera, domElement, physicsSystem) {
    this.camera = camera
    this.domElement = domElement
    this.physicsSystem = physicsSystem
    
    // 移动参数
    this.moveSpeed = 5.0
    this.sprintMultiplier = 1.8
    this.jumpSpeed = 8.0
    
    // 视角控制
    this.mouseSensitivity = 0.002
    
    // 状态
    this.isLocked = false
    this.velocity = new THREE.Vector3()
    this.grounded = false
    
    // 输入状态
    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.isSprinting = false
    
    // 欧拉角用于旋转
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ')
    
    this.init()
  }
  
  init() {
    this.domElement.addEventListener('click', () => {
      if (!this.isLocked) {
        this.domElement.requestPointerLock()
      }
    })
    
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.domElement
    })
    
    document.addEventListener('mousemove', (event) => {
      if (!this.isLocked) return
      
      const movementX = event.movementX || 0
      const movementY = event.movementY || 0
      
      this.euler.setFromQuaternion(this.camera.quaternion)
      this.euler.y -= movementX * this.mouseSensitivity
      this.euler.x -= movementY * this.mouseSensitivity
      
      // 限制垂直视角
      this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x))
      
      this.camera.quaternion.setFromEuler(this.euler)
    })
    
    document.addEventListener('keydown', (event) => this.onKeyDown(event))
    document.addEventListener('keyup', (event) => this.onKeyUp(event))
  }
  
  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = true; break
      case 'KeyS': this.moveBackward = true; break
      case 'KeyA': this.moveLeft = true; break
      case 'KeyD': this.moveRight = true; break
      case 'Space':
        if (this.grounded) {
          this.velocity.y = this.jumpSpeed
          this.grounded = false
        }
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = true
        break
    }
  }
  
  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW': this.moveForward = false; break
      case 'KeyS': this.moveBackward = false; break
      case 'KeyA': this.moveLeft = false; break
      case 'KeyD': this.moveRight = false; break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isSprinting = false
        break
    }
  }
  
  update(deltaTime) {
    if (!this.isLocked) return
    
    // 应用重力
    this.physicsSystem.applyGravity(this.velocity, deltaTime)
    
    // 计算水平移动方向（基于相机朝向）
    const forward = new THREE.Vector3()
    this.camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()
    
    // 计算水平速度
    const moveDir = new THREE.Vector3()
    if (this.moveForward) moveDir.add(forward)
    if (this.moveBackward) moveDir.sub(forward)
    if (this.moveRight) moveDir.add(right)
    if (this.moveLeft) moveDir.sub(right)
    
    if (moveDir.length() > 0) {
      moveDir.normalize()
      let speed = this.moveSpeed
      if (this.isSprinting) speed *= this.sprintMultiplier
      this.velocity.x = moveDir.x * speed
      this.velocity.z = moveDir.z * speed
    } else {
      this.velocity.x = 0
      this.velocity.z = 0
    }
    
    // 碰撞检测与响应
    const result = this.physicsSystem.moveAndCollide(
      this.camera.position,
      this.velocity,
      deltaTime
    )
    
    this.grounded = result.grounded
  }
  
  dispose() {
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }
}
