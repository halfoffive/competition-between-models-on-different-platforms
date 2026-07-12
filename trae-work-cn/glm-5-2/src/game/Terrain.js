import { createNoise2D } from 'simplex-noise'
import { BLOCK, SEA_LEVEL } from './blocks.js'
import { CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js'

// 种子随机函数 mulberry32
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 基于坐标的确定性 hash，返回 0-1
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h = h ^ (h >>> 16)
  return (h >>> 0) / 4294967296
}

// 程序化地形生成
export class Terrain {
  constructor(seed) {
    this.seed = seed
    this.heightNoise = createNoise2D(mulberry32(seed))
    this.biomeNoise = createNoise2D(mulberry32(seed + 9999))
    this.treeNoise = createNoise2D(mulberry32(seed + 7777))
    this.treeRng = mulberry32(seed + 5555)
  }

  // 判定生物群系
  getBiome(wx, wz) {
    const b = this.biomeNoise(wx * 0.005, wz * 0.005)
    if (b < -0.3) return 'desert'
    if (b > 0.3) return 'forest'
    return 'plains'
  }

  // 多倍频高度计算
  getHeight(wx, wz, biome) {
    let h = 64
    h += this.heightNoise(wx * 0.01, wz * 0.01) * 8
    h += this.heightNoise(wx * 0.03, wz * 0.03) * 4
    h += this.heightNoise(wx * 0.06, wz * 0.06) * 2
    if (biome === 'desert') h -= 2
    if (biome === 'forest') h += 2
    return Math.floor(h)
  }

  // 生成整个区块
  generate(chunk) {
    const cx = chunk.cx
    const cz = chunk.cz

    // 第一遍：地形柱
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = cx * CHUNK_SIZE + x
        const wz = cz * CHUNK_SIZE + z
        const biome = this.getBiome(wx, wz)
        const height = this.getHeight(wx, wz, biome)
        this.fillColumn(chunk, x, z, wx, wz, height, biome)
      }
    }

    // 第二遍：树木与仙人掌
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = cx * CHUNK_SIZE + x
        const wz = cz * CHUNK_SIZE + z
        const biome = this.getBiome(wx, wz)
        const height = this.getHeight(wx, wz, biome)
        // 地表上方放置植被
        this.placeVegetation(chunk, x, z, height, biome, wx, wz)
      }
    }

    chunk.generated = true
  }

  // 填充单列方块
  fillColumn(chunk, x, z, wx, wz, height, biome) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      let block = BLOCK.AIR

      if (y === 0) {
        block = BLOCK.BEDROCK
      } else if (y < height - 4) {
        block = BLOCK.STONE
        // 矿石替换
        if (y < 30) {
          const r = hash3(wx, y, wz)
          if (r < 0.008) block = BLOCK.COAL_ORE
          else if (r < 0.012) block = BLOCK.IRON_ORE
        } else if (y < 50) {
          const r = hash3(wx, y, wz)
          if (r < 0.006) block = BLOCK.COAL_ORE
        }
      } else if (y < height - 1) {
        // 地下层
        block = biome === 'desert' ? BLOCK.SAND : BLOCK.DIRT
      } else if (y < height) {
        // 地表层
        block = this.surfaceBlock(biome)
      }

      // 水填充：地表低于海平面的部分填水
      if (block === BLOCK.AIR && y <= SEA_LEVEL) {
        block = BLOCK.WATER
      }

      // 海平面以下的地表方块如果低于水面，草地变泥沙
      if (y < SEA_LEVEL && (block === BLOCK.GRASS)) {
        block = BLOCK.DIRT
      }

      chunk.setBlock(x, y, z, block)
    }
  }

  // 地表方块
  surfaceBlock(biome) {
    if (biome === 'desert') return BLOCK.SAND
    return BLOCK.GRASS
  }

  // 放置植被（树木/仙人掌）
  placeVegetation(chunk, x, z, height, biome, wx, wz) {
    if (height <= SEA_LEVEL) return // 水下不放树

    if (biome === 'desert') {
      // 仙人掌
      const r = hash3(wx, 131, wz)
      if (r < 0.01) {
        const cactusH = 1 + Math.floor(hash3(wx, 222, wz) * 3) // 1-3 格
        for (let i = 1; i <= cactusH; i++) {
          chunk.setBlock(x, height + i, z, BLOCK.CACTUS)
        }
      }
    } else {
      const density = biome === 'forest' ? 0.08 : 0.02
      const r = hash3(wx, 333, wz)
      if (r < density) {
        const treeH = 4 + Math.floor(hash3(wx, 444, wz) * 3) // 4-6 格
        this.placeTree(chunk, x, height + 1, z, treeH)
      }
    }
  }

  // 放置一棵树
  placeTree(chunk, lx, ly, lz, height) {
    // 树干
    for (let i = 0; i < height; i++) {
      chunk.setBlock(lx, ly + i, lz, BLOCK.LOG)
    }
    const topY = ly + height
    // 底部树叶层（半径 2）
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 3) continue
        for (let dy = -1; dy <= 0; dy++) {
          this.setIfAir(chunk, lx + dx, topY + dy, lz + dz, BLOCK.LEAVES)
        }
      }
    }
    // 顶部树叶层（半径 1）
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.setIfAir(chunk, lx + dx, topY + 1, lz + dz, BLOCK.LEAVES)
      }
    }
    // 树顶
    this.setIfAir(chunk, lx, topY + 2, lz, BLOCK.LEAVES)
  }

  // 仅在空气位置设置方块（用于树叶不覆盖树干）
  setIfAir(chunk, x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) return
    if (chunk.getBlock(x, y, z) === BLOCK.AIR) {
      chunk.setBlock(x, y, z, id)
    }
  }
}
