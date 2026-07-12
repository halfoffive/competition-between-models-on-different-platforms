import { PerspectiveCamera, Vector3 } from 'three'
import { World } from '@/world/World'
import { isSolid } from '@/blocks/BlockType'
import { gameState } from '@/stores/gameState'

const HALF_SIZE = new Vector3(0.3, 0.9, 0.3)
const EYE_OFFSET = 0.9
const GRAVITY = -28
const JUMP_SPEED = 9.5
const WALK_SPEED = 5.0
const SNEAK_SPEED = 2.0
const MOUSE_SENSITIVITY = 0.002
const MAX_PITCH = Math.PI / 2 - 0.01

interface AABB {
  min: Vector3
  max: Vector3
}

export class FirstPersonController {
  private camera: PerspectiveCamera
  private domElement: HTMLElement
  private world: World

  private position = new Vector3()
  private velocity = new Vector3()
  private yaw = 0
  private pitch = 0
  private onGround = false
  private isLocked = false

  private keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
    shift: false,
  }

  private boundKeyDown: (e: KeyboardEvent) => void
  private boundKeyUp: (e: KeyboardEvent) => void
  private boundMouseMove: (e: MouseEvent) => void
  private boundPointerLockChange: () => void
  private boundClick: () => void

  constructor(camera: PerspectiveCamera, domElement: HTMLElement, world: World) {
    this.camera = camera
    this.domElement = domElement
    this.world = world

    this.boundKeyDown = this.onKeyDown.bind(this)
    this.boundKeyUp = this.onKeyUp.bind(this)
    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundPointerLockChange = this.onPointerLockChange.bind(this)
    this.boundClick = this.requestPointerLock.bind(this)

    document.addEventListener('keydown', this.boundKeyDown)
    document.addEventListener('keyup', this.boundKeyUp)
    document.addEventListener('mousemove', this.boundMouseMove)
    document.addEventListener('pointerlockchange', this.boundPointerLockChange)
    this.domElement.addEventListener('click', this.boundClick)

    this.syncCamera()
  }

  getPosition(): Vector3 {
    return this.position.clone()
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z)
    this.syncCamera()
  }

  getYaw(): number {
    return this.yaw
  }

  getPitch(): number {
    return this.pitch
  }

  setRotation(yaw: number, pitch: number): void {
    this.yaw = yaw
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch))
    this.syncCamera()
  }

  isPointerLocked(): boolean {
    return this.isLocked
  }

  requestPointerLock(): void {
    if (this.isLocked) return
    this.domElement.requestPointerLock?.()
  }

  exitPointerLock(): void {
    document.exitPointerLock?.()
  }

  private onPointerLockChange(): void {
    this.isLocked = document.pointerLockElement === this.domElement
    gameState.locked = this.isLocked
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isLocked) return
    this.yaw -= e.movementX * MOUSE_SENSITIVITY
    this.pitch -= e.movementY * MOUSE_SENSITIVITY
    this.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, this.pitch))
    this.syncCamera()
  }

  private onKeyDown(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this.keys.w = true
        break
      case 'KeyA':
        this.keys.a = true
        break
      case 'KeyS':
        this.keys.s = true
        break
      case 'KeyD':
        this.keys.d = true
        break
      case 'Space':
        this.keys.space = true
        if (this.onGround) {
          this.velocity.y = JUMP_SPEED
          this.onGround = false
        }
        e.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true
        break
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'KeyW':
        this.keys.w = false
        break
      case 'KeyA':
        this.keys.a = false
        break
      case 'KeyS':
        this.keys.s = false
        break
      case 'KeyD':
        this.keys.d = false
        break
      case 'Space':
        this.keys.space = false
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false
        break
    }
  }

  update(dt: number): void {
    const speed = this.keys.shift ? SNEAK_SPEED : WALK_SPEED
    const forward = new Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    const move = new Vector3()
    if (this.keys.w) move.add(forward)
    if (this.keys.s) move.sub(forward)
    if (this.keys.d) move.add(right)
    if (this.keys.a) move.sub(right)

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed)
    }

    this.velocity.x = move.x
    this.velocity.z = move.z
    this.velocity.y += GRAVITY * dt

    if (!this.isLocked) {
      this.velocity.x = 0
      this.velocity.z = 0
    }

    this.moveAxis('x', this.velocity.x * dt)
    this.moveAxis('z', this.velocity.z * dt)
    const hitDown = this.moveAxis('y', this.velocity.y * dt)
    this.onGround = hitDown && this.velocity.y <= 0

    if (this.onGround && this.velocity.y < 0) {
      this.velocity.y = 0
    }

    this.syncCamera()
  }

  private moveAxis(axis: 'x' | 'y' | 'z', delta: number): boolean {
    if (Math.abs(delta) < 1e-6) return false

    const center = this.position.clone()
    center[axis] += delta
    const aabb = this.getAABB(center)

    let collided = false
    let corrected = center[axis]

    const minX = Math.floor(aabb.min.x)
    const maxX = Math.floor(aabb.max.x)
    const minY = Math.floor(aabb.min.y)
    const maxY = Math.floor(aabb.max.y)
    const minZ = Math.floor(aabb.min.z)
    const maxZ = Math.floor(aabb.max.z)

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (!isSolid(this.world.getBlock(x, y, z))) continue

          const blockMin = new Vector3(x, y, z)
          const blockMax = new Vector3(x + 1, y + 1, z + 1)
          if (!this.intersectAABB(aabb.min, aabb.max, blockMin, blockMax)) continue

          collided = true

          if (axis === 'x') {
            if (delta > 0) {
              corrected = Math.min(corrected, blockMin.x - HALF_SIZE.x)
            } else {
              corrected = Math.max(corrected, blockMax.x + HALF_SIZE.x)
            }
          } else if (axis === 'y') {
            if (delta > 0) {
              corrected = Math.min(corrected, blockMin.y - HALF_SIZE.y)
            } else {
              corrected = Math.max(corrected, blockMax.y + HALF_SIZE.y)
            }
          } else {
            if (delta > 0) {
              corrected = Math.min(corrected, blockMin.z - HALF_SIZE.z)
            } else {
              corrected = Math.max(corrected, blockMax.z + HALF_SIZE.z)
            }
          }
        }
      }
    }

    this.position[axis] = corrected
    return collided
  }

  private getAABB(center: Vector3): AABB {
    return {
      min: new Vector3(center.x - HALF_SIZE.x, center.y - HALF_SIZE.y, center.z - HALF_SIZE.z),
      max: new Vector3(center.x + HALF_SIZE.x, center.y + HALF_SIZE.y, center.z + HALF_SIZE.z),
    }
  }

  private intersectAABB(minA: Vector3, maxA: Vector3, minB: Vector3, maxB: Vector3): boolean {
    return (
      minA.x < maxB.x &&
      maxA.x > minB.x &&
      minA.y < maxB.y &&
      maxA.y > minB.y &&
      minA.z < maxB.z &&
      maxA.z > minB.z
    )
  }

  private syncCamera(): void {
    this.camera.position.copy(this.position).add(new Vector3(0, EYE_OFFSET, 0))
    this.camera.rotation.order = 'YXZ'
    this.camera.rotation.y = this.yaw
    this.camera.rotation.x = this.pitch
  }

  dispose(): void {
    document.removeEventListener('keydown', this.boundKeyDown)
    document.removeEventListener('keyup', this.boundKeyUp)
    document.removeEventListener('mousemove', this.boundMouseMove)
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange)
    this.domElement.removeEventListener('click', this.boundClick)
    this.exitPointerLock()
  }
}
