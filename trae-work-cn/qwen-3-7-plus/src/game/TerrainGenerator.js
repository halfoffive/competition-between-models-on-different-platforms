import { createNoise2D, createNoise3D } from 'simplex-noise'
import { BlockType } from './Block.js'
import { CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js'

export class TerrainGenerator {
  constructor(seed = 12345) {
    // 使用种子创建随机数生成器
    const rng = this.createRNG(seed)
    
    // 2D 噪声用于地形高度
    this.noise2D = createNoise2D(rng)
    // 3D 噪声用于洞穴
    this.noise3D = createNoise3D(rng)
    // 2D 噪声用于树木分布
    this.treeNoise = createNoise2D(rng)
  }

  // 简单的伪随机数生成器（可重复）
  createRNG(seed) {
    let s = seed
    return () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
  }

  // 获取地形高度（多八度噪声）
  getHeight(worldX, worldZ) {
    let height = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0

    // 基础地形（平原/山丘）
    for (let i = 0; i < 4; i++) {
      const nx = worldX / 100 * frequency
      const nz = worldZ / 100 * frequency
      const noiseValue = this.noise2D(nx, nz)
      height += noiseValue * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    // 归一化到 0-1
    height = (height / maxValue + 1) / 2

    // 映射到实际高度（海平面 64，最高约 128）
    return Math.floor(64 + height * 64)
  }

  // 检查是否有洞穴
  hasCave(worldX, worldY, worldZ) {
    if (worldY < 5 || worldY > 60) return false // 洞穴只在低处
    
    const scale = 0.05
    const noise = this.noise3D(worldX * scale, worldY * scale, worldZ * scale)
    return noise > 0.6 // 阈值控制洞穴大小
  }

  // 生成区块地形
  generateChunk(chunk) {
    const baseX = chunk.chunkX * CHUNK_SIZE
    const baseZ = chunk.chunkZ * CHUNK_SIZE

    for (let localX = 0; localX < CHUNK_SIZE; localX++) {
      for (let localZ = 0; localZ < CHUNK_SIZE; localZ++) {
        const worldX = baseX + localX
        const worldZ = baseZ + localZ
        const height = this.getHeight(worldX, worldZ)

        // 基岩层
        chunk.setBlock(localX, 0, localZ, BlockType.BEDROCK)

        for (let y = 1; y < CHUNK_HEIGHT; y++) {
          if (y > height) break

          // 检查洞穴
          if (this.hasCave(worldX, y, worldZ)) {
            continue // 洞穴空间，不放置方块
          }

          let blockType

          if (y === height) {
            // 表层
            if (height < 66) {
              blockType = BlockType.SAND // 海滩
            } else {
              blockType = BlockType.GRASS // 草地
            }
          } else if (y > height - 4) {
            // 泥土层
            if (height < 66) {
              blockType = BlockType.SAND
            } else {
              blockType = BlockType.DIRT
            }
          } else {
            // 石头层（包含矿石）
            blockType = this.getOreBlock(y)
          }

          chunk.setBlock(localX, y, localZ, blockType)
        }

        // 生成树木
        if (height >= 66 && this.shouldPlaceTree(worldX, worldZ)) {
          this.generateTree(chunk, localX, height + 1, localZ)
        }
      }
    }
  }

  // 根据高度决定矿石类型
  getOreBlock(y) {
    const rand = Math.random()
    
    if (y < 16 && rand < 0.005) {
      return BlockType.DIAMOND_ORE
    } else if (y < 64 && rand < 0.01) {
      return BlockType.IRON_ORE
    } else if (y < 128 && rand < 0.015) {
      return BlockType.COAL_ORE
    }
    
    return BlockType.STONE
  }

  // 检查是否应该放置树木
  shouldPlaceTree(worldX, worldZ) {
    const noise = this.treeNoise(worldX / 10, worldZ / 10)
    return noise > 0.7 && Math.random() < 0.1 // 10% 概率
  }

  // 生成树木
  generateTree(chunk, x, y, z) {
    const trunkHeight = 4 + Math.floor(Math.random() * 3) // 4-6 格高

    // 树干
    for (let i = 0; i < trunkHeight; i++) {
      if (y + i < CHUNK_HEIGHT) {
        chunk.setBlock(x, y + i, z, BlockType.WOOD)
      }
    }

    // 树叶（简单的球形）
    const leafStart = y + trunkHeight - 2
    const leafEnd = y + trunkHeight + 1

    for (let ly = leafStart; ly <= leafEnd; ly++) {
      const radius = ly === leafEnd ? 1 : 2
      for (let lx = -radius; lx <= radius; lx++) {
        for (let lz = -radius; lz <= radius; lz++) {
          if (Math.abs(lx) === radius && Math.abs(lz) === radius) continue // 圆角
          
          const tx = x + lx
          const tz = z + lz
          
          if (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
            if (chunk.getBlock(tx, ly, tz) === BlockType.AIR) {
              chunk.setBlock(tx, ly, tz, BlockType.LEAVES)
            }
          }
        }
      }
    }
  }
}
