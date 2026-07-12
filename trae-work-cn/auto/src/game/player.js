import * as THREE from 'three'
import { clamp } from '../utils/math.js'

export class Player {
  constructor() {
    this.position = new THREE.Vector3(0, 20, 0)
    this.velocity = new THREE.Vector3(0, 0, 0)
    this.yaw = 0
    this.pitch = 0
    this.speed = 5
    this.sprintMultiplier = 1.6
    this.flySpeed = 7
    this.gravity = -25
    this.jumpForce = 9
    this.onGround = false
    this.height = 1.8
    this.width = 0.6
    this.flying = false
    this.lastSpaceTime = 0
    this.doubleTapThreshold = 0.3
  }

  getEyeHeight() {
    return this.height * 0.9
  }

  getAABB(pos = this.position) {
    const hw = this.width / 2
    return {
      minX: pos.x - hw,
      maxX: pos.x + hw,
      minY: pos.y,
      maxY: pos.y + this.height,
      minZ: pos.z - hw,
      maxZ: pos.z + hw
    }
  }

  _checkAABBCollision(world, aabb) {
    const minX = Math.floor(aabb.minX)
    const maxX = Math.floor(aabb.maxX)
    const minY = Math.floor(aabb.minY)
    const maxY = Math.floor(aabb.maxY)
    const minZ = Math.floor(aabb.minZ)
    const maxZ = Math.floor(aabb.maxZ)

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (world.isSolid(x, y, z)) {
            return true
          }
        }
      }
    }
    return false
  }

  update(delta, world, input) {
    if (this.flying) {
      this._updateFlying(delta, world, input)
    } else {
      this._updateNormal(delta, world, input)
    }
  }

  _updateNormal(delta, world, input) {
    this.velocity.y += this.gravity * delta

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    let moveX = 0
    let moveZ = 0

    if (input.forward) { moveX += forward.x; moveZ += forward.z }
    if (input.backward) { moveX -= forward.x; moveZ -= forward.z }
    if (input.right) { moveX += right.x; moveZ += right.z }
    if (input.left) { moveX -= right.x; moveZ -= right.z }

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (len > 0) {
      moveX /= len
      moveZ /= len
    }

    let speed = this.speed
    if (input.sprint && this.onGround) {
      speed *= this.sprintMultiplier
    }

    const dx = moveX * speed * delta
    const dz = moveZ * speed * delta
    const dy = this.velocity.y * delta

    this._moveAxis(world, dx, 0, 0)
    this._moveAxis(world, 0, 0, dz)

    const grounded = this._moveAxis(world, 0, dy, 0)

    if (grounded && dy < 0) {
      this.onGround = true
      this.velocity.y = 0
    } else if (grounded && dy > 0) {
      this.velocity.y = 0
      this.onGround = false
    } else {
      this.onGround = false
    }

    if (input.jump && this.onGround) {
      this.velocity.y = this.jumpForce
      this.onGround = false
    }

    const now = performance.now() / 1000
    if (input.jump && !this._jumpWasPressed) {
      if (now - this.lastSpaceTime < this.doubleTapThreshold) {
        this.flying = true
        this.velocity.y = 0
      }
      this.lastSpaceTime = now
    }
    this._jumpWasPressed = input.jump
  }

  _updateFlying(delta, world, input) {
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

    let moveX = 0
    let moveY = 0
    let moveZ = 0

    if (input.forward) { moveX += forward.x; moveZ += forward.z }
    if (input.backward) { moveX -= forward.x; moveZ -= forward.z }
    if (input.right) { moveX += right.x; moveZ += right.z }
    if (input.left) { moveX -= right.x; moveZ -= right.z }

    if (input.jump) moveY += 1
    if (input.sprint) moveY -= 1

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (len > 0) {
      moveX /= len
      moveZ /= len
    }

    const dx = moveX * this.flySpeed * delta
    const dy = moveY * this.flySpeed * delta
    const dz = moveZ * this.flySpeed * delta

    this._moveAxis(world, dx, 0, 0)
    this._moveAxis(world, 0, dy, 0)
    this._moveAxis(world, 0, 0, dz)

    this.onGround = false

    const now = performance.now() / 1000
    if (input.jump && !this._jumpWasPressed) {
      if (now - this.lastSpaceTime < this.doubleTapThreshold) {
        this.flying = false
        this.velocity.y = 0
      }
      this.lastSpaceTime = now
    }
    this._jumpWasPressed = input.jump
  }

  _moveAxis(world, dx, dy, dz) {
    const testPos = this.position.clone()
    testPos.x += dx
    testPos.y += dy
    testPos.z += dz

    const aabb = this.getAABB(testPos)

    if (!this._checkAABBCollision(world, aabb)) {
      this.position.copy(testPos)
      return false
    }

    if (dx !== 0) {
      const step = dx > 0 ? -0.01 : 0.01
      while (Math.abs(dx) > 0) {
        testPos.x = this.position.x + dx
        const testAABB = this.getAABB(testPos)
        if (!this._checkAABBCollision(world, testAABB)) {
          this.position.x = testPos.x
          break
        }
        dx += step
        if ((dx > 0 && step > 0) || (dx < 0 && step < 0)) break
      }
    }

    if (dy !== 0) {
      const step = dy > 0 ? -0.01 : 0.01
      while (Math.abs(dy) > 0) {
        testPos.y = this.position.y + dy
        const testAABB = this.getAABB(testPos)
        if (!this._checkAABBCollision(world, testAABB)) {
          this.position.y = testPos.y
          return true
        }
        dy += step
        if ((dy > 0 && step > 0) || (dy < 0 && step < 0)) break
      }
      return true
    }

    if (dz !== 0) {
      const step = dz > 0 ? -0.01 : 0.01
      while (Math.abs(dz) > 0) {
        testPos.z = this.position.z + dz
        const testAABB = this.getAABB(testPos)
        if (!this._checkAABBCollision(world, testAABB)) {
          this.position.z = testPos.z
          break
        }
        dz += step
        if ((dz > 0 && step > 0) || (dz < 0 && step < 0)) break
      }
    }

    return false
  }

  addRotation(dx, dy) {
    this.yaw -= dx * 0.002
    this.pitch -= dy * 0.002
    this.pitch = clamp(this.pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01)
  }

  applyRotation(camera) {
    camera.position.copy(this.position)
    camera.position.y += this.getEyeHeight()
    camera.rotation.order = 'YXZ'
    camera.rotation.y = this.yaw
    camera.rotation.x = this.pitch
  }

  spawnAtSurface(world) {
    const cx = Math.floor(world.width / 2)
    const cz = Math.floor(world.depth / 2)
    const surfaceY = world.getHighestBlockY(cx, cz)
    this.position.set(cx + 0.5, surfaceY + 2, cz + 0.5)
    this.velocity.set(0, 0, 0)
    this.flying = false
    this.onGround = false
  }
}
