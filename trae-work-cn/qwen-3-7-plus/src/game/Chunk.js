import { BlockType } from './Block.js'

export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 256

export class Chunk {
  constructor(chunkX, chunkZ) {
    this.chunkX = chunkX
    this.chunkZ = chunkZ
    this.blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    this.mesh = null
    this.isDirty = true
    this.isModified = false // 标记是否被玩家修改过
  }

  getIndex(x, y, z) {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x
  }

  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR
    }
    return this.blocks[this.getIndex(x, y, z)]
  }

  setBlock(x, y, z, blockType) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return
    }
    this.blocks[this.getIndex(x, y, z)] = blockType
    this.isDirty = true
    this.isModified = true
  }

  // 序列化区块数据（仅保存修改过的数据）
  serialize() {
    if (!this.isModified) return null
    
    const modifiedBlocks = []
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const block = this.getBlock(x, y, z)
          if (block !== BlockType.AIR) {
            modifiedBlocks.push({ x, y, z, block })
          }
        }
      }
    }
    
    return {
      chunkX: this.chunkX,
      chunkZ: this.chunkZ,
      blocks: modifiedBlocks
    }
  }

  // 反序列化区块数据
  deserialize(data) {
    if (!data || !data.blocks) return
    
    for (const { x, y, z, block } of data.blocks) {
      this.setBlock(x, y, z, block)
    }
    
    this.isModified = true
  }
}
