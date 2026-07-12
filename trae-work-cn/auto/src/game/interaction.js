import * as THREE from 'three'
import { BlockType } from './blocks.js'
import { FaceOffsets } from './world.js'

export class InteractionSystem {
  constructor(world, renderer, player) {
    this.world = world
    this.renderer = renderer
    this.player = player
    this.raycaster = new THREE.Raycaster()
    this.reach = 6
    this.targetBlock = null
    this.targetFace = null
    this.targetNormal = null
  }

  update() {
    const camera = this.renderer.camera
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
    this.raycaster.far = this.reach

    const result = this._raycastBlocks()

    if (result) {
      this.targetBlock = { x: result.x, y: result.y, z: result.z }
      this.targetFace = result.face
      this.targetNormal = FaceOffsets[result.face]
      this.renderer.setHighlight(result.x, result.y, result.z)
    } else {
      this.targetBlock = null
      this.targetFace = null
      this.targetNormal = null
      this.renderer.setHighlight(null, null, null)
    }

    return result
  }

  _raycastBlocks() {
    const camera = this.renderer.camera
    const origin = camera.position.clone()
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)

    const maxDist = this.reach
    let t = 0
    const stepSize = 0.1

    let lastBlock = null

    while (t < maxDist) {
      const pos = origin.clone().add(direction.clone().multiplyScalar(t))
      const bx = Math.floor(pos.x)
      const by = Math.floor(pos.y)
      const bz = Math.floor(pos.z)

      const blockKey = `${bx},${by},${bz}`
      if (!lastBlock || lastBlock !== blockKey) {
        lastBlock = blockKey
        const block = this.world.getBlock(bx, by, bz)
        if (block !== BlockType.AIR && this.world.isSolid(bx, by, bz)) {
          const face = this._findEntryFace(origin, direction, bx, by, bz, t)
          return { x: bx, y: by, z: bz, face }
        }
      }

      t += stepSize
    }

    return null
  }

  _findEntryFace(origin, direction, bx, by, bz, currentT) {
    const minX = bx
    const maxX = bx + 1
    const minY = by
    const maxY = by + 1
    const minZ = bz
    const maxZ = bz + 1

    let bestFace = 0
    let bestT = Infinity

    const faces = [
      { axis: 'x', side: 1, face: 0, val: maxX },
      { axis: 'x', side: -1, face: 1, val: minX },
      { axis: 'y', side: 1, face: 2, val: maxY },
      { axis: 'y', side: -1, face: 3, val: minY },
      { axis: 'z', side: 1, face: 4, val: maxZ },
      { axis: 'z', side: -1, face: 5, val: minZ }
    ]

    for (const f of faces) {
      const dirAxis = direction[f.axis]
      if (Math.abs(dirAxis) < 0.0001) continue

      const t = (f.val - origin[f.axis]) / dirAxis
      if (t > 0 && t < bestT) {
        const other1 = f.axis === 'x' ? 'y' : f.axis === 'y' ? 'x' : 'x'
        const other2 = f.axis === 'x' ? 'z' : f.axis === 'y' ? 'z' : 'y'
        const p1 = origin[other1] + direction[other1] * t
        const p2 = origin[other2] + direction[other2] * t

        let min1, max1, min2, max2
        if (other1 === 'x') { min1 = minX; max1 = maxX }
        else if (other1 === 'y') { min1 = minY; max1 = maxY }
        else { min1 = minZ; max1 = maxZ }
        if (other2 === 'x') { min2 = minX; max2 = maxX }
        else if (other2 === 'y') { min2 = minY; max2 = maxY }
        else { min2 = minZ; max2 = maxZ }

        if (p1 >= min1 && p1 <= max1 && p2 >= min2 && p2 <= max2) {
          bestT = t
          bestFace = f.face
        }
      }
    }

    return bestFace
  }

  breakBlock() {
    if (!this.targetBlock) return false

    const { x, y, z } = this.targetBlock
    this.world.setBlock(x, y, z, BlockType.AIR)
    this.renderer.updateBlock(this.world, x, y, z)
    return true
  }

  placeBlock(blockType) {
    if (!this.targetBlock || !this.targetNormal) return false

    const { x, y, z } = this.targetBlock
    const nx = x + this.targetNormal.x
    const ny = y + this.targetNormal.y
    const nz = z + this.targetNormal.z

    if (!this._canPlaceBlock(nx, ny, nz)) return false

    this.world.setBlock(nx, ny, nz, blockType)
    this.renderer.updateBlock(this.world, nx, ny, nz)
    return true
  }

  _canPlaceBlock(x, y, z) {
    if (this.world.isSolid(x, y, z)) return false

    const playerAABB = this.player.getAABB()
    const blockMinX = x
    const blockMaxX = x + 1
    const blockMinY = y
    const blockMaxY = y + 1
    const blockMinZ = z
    const blockMaxZ = z + 1

    if (playerAABB.maxX > blockMinX && playerAABB.minX < blockMaxX &&
        playerAABB.maxY > blockMinY && playerAABB.minY < blockMaxY &&
        playerAABB.maxZ > blockMinZ && playerAABB.minZ < blockMaxZ) {
      return false
    }

    return true
  }
}
