import { BlockType, BlockTransparent, BlockSolid } from './blocks.js'

export const FaceDirection = {
  RIGHT: 0,
  LEFT: 1,
  TOP: 2,
  BOTTOM: 3,
  FRONT: 4,
  BACK: 5
}

export const FaceOffsets = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 }
]

export class World {
  constructor(width = 64, height = 32, depth = 64) {
    this.width = width
    this.height = height
    this.depth = depth
    this.blocks = new Uint8Array(width * height * depth)
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return BlockType.AIR
    }
    return this.blocks[this.getIndex(x, y, z)]
  }

  setBlock(x, y, z, type) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || z < 0 || z >= this.depth) {
      return
    }
    this.blocks[this.getIndex(x, y, z)] = type
  }

  getIndex(x, y, z) {
    return x + y * this.width + z * this.width * this.height
  }

  isSolid(x, y, z) {
    const block = this.getBlock(x, y, z)
    return BlockSolid[block] === true
  }

  isOpaque(x, y, z) {
    const block = this.getBlock(x, y, z)
    if (block === BlockType.AIR) return false
    return BlockTransparent[block] === false
  }

  getBlockFaceVisibility(x, y, z) {
    const block = this.getBlock(x, y, z)
    if (block === BlockType.AIR) {
      return [false, false, false, false, false, false]
    }

    const faces = [false, false, false, false, false, false]
    const selfTransparent = BlockTransparent[block]

    for (let i = 0; i < 6; i++) {
      const offset = FaceOffsets[i]
      const nx = x + offset.x
      const ny = y + offset.y
      const nz = z + offset.z
      const neighbor = this.getBlock(nx, ny, nz)

      if (neighbor === BlockType.AIR) {
        faces[i] = true
      } else if (selfTransparent) {
        if (!BlockTransparent[neighbor]) {
          faces[i] = true
        } else if (neighbor !== block) {
          faces[i] = true
        }
      } else {
        if (BlockTransparent[neighbor]) {
          faces[i] = true
        }
      }
    }

    return faces
  }

  getHighestBlockY(x, z) {
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.isSolid(x, y, z)) {
        return y
      }
    }
    return -1
  }
}
