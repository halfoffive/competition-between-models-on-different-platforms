import { Chunk, CHUNK_SIZE } from './Chunk.js'
import { BlockType } from './Block.js'

export class World {
  constructor() {
    this.chunks = new Map() // key: "chunkX,chunkZ" -> Chunk
  }

  getChunkKey(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`
  }

  getChunk(chunkX, chunkZ) {
    return this.chunks.get(this.getChunkKey(chunkX, chunkZ))
  }

  getOrCreateChunk(chunkX, chunkZ) {
    const key = this.getChunkKey(chunkX, chunkZ)
    if (!this.chunks.has(key)) {
      this.chunks.set(key, new Chunk(chunkX, chunkZ))
    }
    return this.chunks.get(key)
  }

  // 世界坐标 -> 区块坐标 + 区块内坐标
  worldToChunk(x, y, z) {
    const chunkX = Math.floor(x / CHUNK_SIZE)
    const chunkZ = Math.floor(z / CHUNK_SIZE)
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    return { chunkX, chunkZ, localX, y, localZ }
  }

  getBlock(x, y, z) {
    const { chunkX, chunkZ, localX, localZ } = this.worldToChunk(x, y, z)
    const chunk = this.getChunk(chunkX, chunkZ)
    if (!chunk) return BlockType.AIR
    return chunk.getBlock(localX, y, localZ)
  }

  setBlock(x, y, z, blockType) {
    const { chunkX, chunkZ, localX, localZ } = this.worldToChunk(x, y, z)
    const chunk = this.getOrCreateChunk(chunkX, chunkZ)
    chunk.setBlock(localX, y, localZ, blockType)
  }

  // 保存所有修改过的区块
  save() {
    const savedChunks = []
    for (const chunk of this.chunks.values()) {
      const data = chunk.serialize()
      if (data) {
        savedChunks.push(data)
      }
    }
    localStorage.setItem('minecraft_world', JSON.stringify(savedChunks))
  }

  // 加载保存的区块
  load() {
    const savedData = localStorage.getItem('minecraft_world')
    if (!savedData) return

    try {
      const savedChunks = JSON.parse(savedData)
      for (const data of savedChunks) {
        const chunk = this.getOrCreateChunk(data.chunkX, data.chunkZ)
        chunk.deserialize(data)
      }
    } catch (e) {
      console.error('Failed to load world:', e)
    }
  }
}
