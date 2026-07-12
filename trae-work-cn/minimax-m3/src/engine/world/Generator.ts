import { BlockId } from './BlockId'
import { Chunk, CHUNK_HEIGHT, CHUNK_SIZE } from './Chunk'
import { makeNoise2D, makeNoise3D, mulberry32 } from '../noise/Noise'

export const SEA_LEVEL = 62
export const BEDROCK_LEVEL = 4

export enum Biome {
  OCEAN = 'ocean',
  BEACH = 'beach',
  PLAINS = 'plains',
  FOREST = 'forest',
  DESERT = 'desert',
  SPRUCE = 'spruce',
  SNOW = 'snow',
  MOUNTAIN = 'mountain',
}

export interface WorldGenConfig {
  seed: number
}

export interface BiomeSample {
  biome: Biome
  temperature: number // 0-1
  humidity: number    // 0-1
  height: number      // 0-1
}

/**
 * 世界生成器：纯函数式，给定区块和配置即可生成。
 * 可在主线程或 Worker 中运行。
 */
export class WorldGenerator {
  readonly seed: number
  private heightNoise: (x: number, z: number) => number
  private detailNoise: (x: number, z: number) => number
  private caveNoise: (x: number, y: number, z: number) => number
  private biomeNoise: (x: number, z: number) => number
  private tempNoise: (x: number, z: number) => number
  private humidityNoise: (x: number, z: number) => number
  private oreNoise: (x: number, y: number, z: number) => number
  private treeRng: () => number
  private flowerRng: () => number

  constructor(config: WorldGenConfig) {
    this.seed = config.seed
    this.heightNoise = makeNoise2D(this.seed + 1, 4, 2.0, 0.5, 1 / 256)
    this.detailNoise = makeNoise2D(this.seed + 2, 3, 2.0, 0.5, 1 / 64)
    this.caveNoise = makeNoise3D(this.seed + 3)
    this.biomeNoise = makeNoise2D(this.seed + 4, 1, 1, 1, 1 / 1024)
    this.tempNoise = makeNoise2D(this.seed + 5, 2, 2.0, 0.5, 1 / 512)
    this.humidityNoise = makeNoise2D(this.seed + 6, 2, 2.0, 0.5, 1 / 512)
    this.oreNoise = makeNoise3D(this.seed + 7)
    this.treeRng = mulberry32(this.seed + 100)
    this.flowerRng = mulberry32(this.seed + 200)
  }

  sampleBiome(wx: number, wz: number): BiomeSample {
    const temp = (this.tempNoise(wx, wz) + 1) * 0.5
    const hum = (this.humidityNoise(wx, wz) + 1) * 0.5
    const heightFactor = (this.heightNoise(wx, wz) + 1) * 0.5

    // 距原点远的地方降温
    const dist = Math.sqrt(wx * wx + wz * wz) / 1000
    const t = Math.max(0, Math.min(1, temp - dist * 0.3))

    let biome: Biome
    if (heightFactor < 0.32) {
      biome = Biome.OCEAN
    } else if (heightFactor < 0.36) {
      biome = Biome.BEACH
    } else if (t < 0.25) {
      biome = Biome.SNOW
    } else if (heightFactor > 0.78) {
      biome = Biome.MOUNTAIN
    } else if (t > 0.7 && hum < 0.4) {
      biome = Biome.DESERT
    } else if (t < 0.45) {
      biome = Biome.SPRUCE
    } else if (hum > 0.55) {
      biome = Biome.FOREST
    } else {
      biome = Biome.PLAINS
    }

    return { biome, temperature: t, humidity: hum, height: heightFactor }
  }

  /** 地形高度（地表最高方块 y 坐标） */
  terrainHeight(wx: number, wz: number): number {
    const sample = this.sampleBiome(wx, wz)
    let h = (this.heightNoise(wx, wz) + 1) * 0.5
    // 山地拔高
    if (sample.biome === Biome.MOUNTAIN) h = h * 0.6 + 0.4
    // 海洋压低
    if (sample.biome === Biome.OCEAN) h = h * 0.4 + 0.15
    // 海滩保持低
    if (sample.biome === Biome.BEACH) h = h * 0.6 + 0.25
    // 加细节
    h += (this.detailNoise(wx, wz) + 1) * 0.5 * 0.05
    h = Math.max(0, Math.min(1, h))
    return Math.floor(h * 80) + 8
  }

  generateChunk(chunk: Chunk): void {
    if (chunk.generated) return
    const { cx, cz } = chunk
    const data = chunk.data

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx
        const wz = cz * CHUNK_SIZE + lz
        const sample = this.sampleBiome(wx, wz)
        const surface = this.terrainHeight(wx, wz)

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const i = Chunk.idx(lx, y, lz)
          let block: BlockId = BlockId.AIR

          if (y === 0) {
            block = BlockId.BEDROCK
          } else if (y < BEDROCK_LEVEL && Math.random() < 0.7) {
            block = BlockId.BEDROCK
          } else if (y > surface) {
            // 表面以上
            if (y <= SEA_LEVEL && sample.biome !== Biome.MOUNTAIN) {
              block = BlockId.WATER
            } else {
              block = BlockId.AIR
            }
          } else {
            // 实心
            if (y === surface) {
              // 顶层
              if (sample.biome === Biome.DESERT) block = BlockId.SAND
              else if (sample.biome === Biome.BEACH) block = BlockId.SAND
              else if (sample.biome === Biome.SNOW) block = (y > 90 ? BlockId.SNOW_BLOCK : BlockId.GRASS)
              else if (sample.biome === Biome.OCEAN) block = (y < SEA_LEVEL - 1 ? BlockId.DIRT : BlockId.SAND)
              else block = BlockId.GRASS
            } else if (y > surface - 4) {
              if (sample.biome === Biome.DESERT) block = BlockId.SAND
              else if (sample.biome === Biome.BEACH) block = BlockId.SAND
              else block = BlockId.DIRT
            } else {
              block = BlockId.STONE
            }

            // 矿物
            if (block === BlockId.STONE) {
              const ore = this.oreNoise(wx, y, wz)
              if (y < 20 && ore > 0.7) block = BlockId.DIAMOND_ORE
              else if (y < 40 && ore > 0.6) block = BlockId.GOLD_ORE
              else if (y < 60 && ore > 0.55) block = BlockId.IRON_ORE
              else if (y < 80 && ore > 0.5) block = BlockId.COAL_ORE
            }
          }

          data[i] = block
        }
      }
    }

    // 洞穴（仅石头区域）
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let y = 1; y < 80; y++) {
          const i = Chunk.idx(lx, y, lz)
          if (data[i] !== BlockId.STONE) continue
          const wx = cx * CHUNK_SIZE + lx
          const wz = cz * CHUNK_SIZE + lz
          const n = this.caveNoise(wx * 0.05, y * 0.08, wz * 0.05)
          // 不要在地表开洞
          const surface = this.terrainHeight(wx, wz)
          if (y < surface - 1 && n > 0.55) {
            data[i] = BlockId.AIR
          }
        }
      }
    }

    // 植被
    this.generateVegetation(chunk)

    // 初始化天空光（地表以上 15，向下递减）
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx
        const wz = cz * CHUNK_SIZE + lz
        const surface = this.terrainHeight(wx, wz)
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const i = Chunk.idx(lx, y, lz)
          if (data[i] === BlockId.AIR || data[i] === BlockId.WATER) {
            // 简化：地表以上 15，向下每格 -1，最低 0
            const dist = Math.max(0, surface - y)
            const v = Math.max(0, 15 - dist)
            chunk.skyLight[i] = v
          }
        }
      }
    }

    chunk.generated = true
    chunk.dirty = true
  }

  private generateVegetation(chunk: Chunk): void {
    const { cx, cz } = chunk
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx
        const wz = cz * CHUNK_SIZE + lz
        const sample = this.sampleBiome(wx, wz)
        const surface = this.terrainHeight(wx, wz)
        if (surface >= CHUNK_HEIGHT - 1) continue
        const surfaceBlock = chunk.getBlock(lx, surface, lz)
        if (surfaceBlock !== BlockId.GRASS && surfaceBlock !== BlockId.SAND) continue

        // 用确定性噪声决定植被
        const r1 = this.flowerRng()
        const r2 = this.treeRng()

        if (sample.biome === Biome.PLAINS || sample.biome === Biome.FOREST) {
          if (surfaceBlock === BlockId.GRASS) {
            if (r1 < 0.04) {
              chunk.setBlock(lx, surface + 1, lz, r1 < 0.02 ? BlockId.FLOWER_RED : BlockId.FLOWER_YELLOW)
            } else if (r1 < 0.18) {
              chunk.setBlock(lx, surface + 1, lz, BlockId.TALL_GRASS)
            }
            // 树木
            if (sample.biome === Biome.FOREST && r2 < 0.12) {
              this.plantTree(chunk, lx, surface + 1, lz, BlockId.OAK_LOG, BlockId.OAK_LEAVES, 4 + Math.floor(r2 * 80) % 3)
            } else if (sample.biome === Biome.PLAINS && r2 < 0.012) {
              this.plantTree(chunk, lx, surface + 1, lz, BlockId.OAK_LOG, BlockId.OAK_LEAVES, 4)
            }
          }
        } else if (sample.biome === Biome.SPRUCE) {
          if (r2 < 0.1) {
            this.plantTree(chunk, lx, surface + 1, lz, BlockId.SPRUCE_LOG, BlockId.SPRUCE_LEAVES, 5 + Math.floor(r2 * 99) % 3)
          }
        } else if (sample.biome === Biome.DESERT) {
          if (surfaceBlock === BlockId.SAND && r2 < 0.01) {
            chunk.setBlock(lx, surface + 1, lz, BlockId.CACTUS)
          }
        }
      }
    }
  }

  private plantTree(chunk: Chunk, x: number, y: number, z: number, log: BlockId, leaves: BlockId, height: number) {
    // 树干
    for (let i = 0; i < height; i++) {
      if (y + i < CHUNK_HEIGHT) chunk.setBlock(x, y + i, z, log)
    }
    // 树冠
    const topY = y + height - 1
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (dx === 0 && dz === 0 && dy < 1) continue
          const r = Math.abs(dx) + Math.abs(dz) + Math.abs(dy)
          if (r > 3) continue
          if (r === 3 && Math.random() < 0.6) continue
          const xx = x + dx
          const zz = z + dz
          const yy = topY + dy
          if (xx < 0 || xx >= CHUNK_SIZE || zz < 0 || zz >= CHUNK_SIZE) continue
          if (yy >= CHUNK_HEIGHT) continue
          if (chunk.getBlock(xx, yy, zz) === BlockId.AIR) {
            chunk.setBlock(xx, yy, zz, leaves)
          }
        }
      }
    }
    // 树尖
    if (topY + 1 < CHUNK_HEIGHT && chunk.getBlock(x, topY + 1, z) === BlockId.AIR) {
      chunk.setBlock(x, topY + 1, z, leaves)
    }
  }
}
