import { NoiseGenerator } from './NoiseGenerator.js'
import { BLOCK_TYPES } from './BlockTypes.js'

export class TerrainGenerator {
  /**
   * @param {number} seed - 地形种子
   */
  constructor(seed = 42) {
    this.seed = seed
    this.noiseGen = new NoiseGenerator(seed)
    // 第二层噪声用于细节
    this.detailNoise = new NoiseGenerator(seed + 1000)
    // 第三层噪声用于树木放置
    this.treeNoise = new NoiseGenerator(seed + 2000)
  }

  /**
   * 生成区块数据（填充 blocks 数组，不创建 mesh）
   * @param {Chunk} chunk - 区块对象
   */
  generateChunkData(chunk) {
    const cx = chunk.cx
    const cz = chunk.cz
    const blocks = chunk.blocks

    // 第一步：生成高度图
    const heightMap = new Array(16 * 16)

    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const worldX = cx * 16 + x
        const worldZ = cz * 16 + z

        // 大尺度噪声：基础地形
        const baseNoise = this.noiseGen.noise2D(worldX * 0.005, worldZ * 0.005)
        // 中尺度噪声：山丘
        const hillNoise = this.noiseGen.noise2D(worldX * 0.02, worldZ * 0.02) * 0.5
        // 小尺度噪声：细节
        const detailNoise = this.detailNoise.noise2D(worldX * 0.05, worldZ * 0.05) * 0.25

        // 组合噪声，映射到 0-80 的高度范围
        let height = (baseNoise + hillNoise + detailNoise) * 40 + 40
        height = Math.max(0, Math.min(80, Math.floor(height)))

        heightMap[x * 16 + z] = height
      }
    }

    // 第二步：根据高度填充方块
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const worldX = cx * 16 + x
        const worldZ = cz * 16 + z
        const height = heightMap[x * 16 + z]

        // 水位线
        const waterLevel = 32

        // 填充地下方块
        for (let y = 0; y <= height; y++) {
          if (y < height - 4) {
            // 深层：石头
            blocks[x][y][z] = BLOCK_TYPES.STONE
          } else if (y < height) {
            // 上层：泥土
            blocks[x][y][z] = BLOCK_TYPES.DIRT
          } else {
            // 顶层：
            if (height < 40) {
              // 低洼地带：沙子
              blocks[x][y][z] = BLOCK_TYPES.SAND
              // 低洼地带地下也填充沙子
              for (let dy = height - 1; dy >= Math.max(0, height - 4); dy--) {
                if (blocks[x][dy][z] === BLOCK_TYPES.DIRT) {
                  blocks[x][dy][z] = BLOCK_TYPES.SAND
                }
              }
            } else {
              // 高地：草方块
              blocks[x][y][z] = BLOCK_TYPES.GRASS
            }
          }
        }

        // 第三步：低洼地带填充水
        if (height < waterLevel) {
          for (let y = height + 1; y <= waterLevel; y++) {
            blocks[x][y][z] = BLOCK_TYPES.WATER
          }
        }

        // 第四步：生成树木
        if (height > 40 && blocks[x][height][z] === BLOCK_TYPES.GRASS) {
          const treeChance = this.treeNoise.noise2D(worldX * 0.1, worldZ * 0.1)
          // 约 8% 概率生成树木
          if (treeChance > 0.7) {
            this._generateTree(blocks, x, height + 1, z, worldX, worldZ)
          }
        }
      }
    }
  }

  /**
   * 在指定位置生成树木
   * @param {Array} blocks - 区块 blocks 数组
   * @param {number} x - 局部 X
   * @param {number} baseY - 树干底部 Y（地面上方第一格）
   * @param {number} z - 局部 Z
   * @param {number} worldX - 世界 X（用于噪声）
   * @param {number} worldZ - 世界 Z（用于噪声）
   */
  _generateTree(blocks, x, baseY, z, worldX, worldZ) {
    const trunkHeight = 4 + Math.floor(
      ((this.treeNoise.noise2D(worldX * 0.5, worldZ * 0.5) + 1) / 2) * 3
    ) // 4-6 格高

    // 树干
    for (let y = baseY; y < baseY + trunkHeight && y < 128; y++) {
      if (x >= 0 && x < 16 && z >= 0 && z < 16 && y >= 0 && y < 128) {
        blocks[x][y][z] = BLOCK_TYPES.WOOD
      }
    }

    // 树冠：在树干顶部生成 3x3x3 的树叶球体
    const crownBaseY = baseY + trunkHeight - 2

    for (let dy = -2; dy <= 2; dy++) {
      const cy = crownBaseY + dy
      if (cy < 0 || cy >= 128) continue

      const radius = dy === 2 ? 1 : 2

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          // 树干位置留空
          if (dx === 0 && dz === 0 && dy >= 0 && dy <= 1) continue

          const nx = x + dx
          const nz = z + dz

          if (nx >= 0 && nx < 16 && nz >= 0 && nz < 16 && cy >= 0 && cy < 128) {
            // 球体形状：只放置距离中心在一定范围内的方块
            const dist = Math.sqrt(dx * dx + dy * 0.7 * dy * 0.7 + dz * dz)
            if (dist <= radius && blocks[nx][cy][nz] === BLOCK_TYPES.AIR) {
              blocks[nx][cy][nz] = BLOCK_TYPES.LEAVES
            }
          }
        }
      }
    }
  }
}