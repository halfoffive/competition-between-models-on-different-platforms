import { createNoise2D } from 'simplex-noise'
import { BlockType } from './blocks.js'

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class TerrainGenerator {
  constructor(seed = 42) {
    this.seed = seed
    const rng = mulberry32(seed)
    this.noise2D = createNoise2D(rng)
    this.noise2D_2 = createNoise2D(mulberry32(seed + 1))
    this.noise2D_3 = createNoise2D(mulberry32(seed + 2))
    this.moistureNoise = createNoise2D(mulberry32(seed + 100))
    this.rng = rng
  }

  fbm(x, z, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, z * frequency) * amplitude
      maxValue += amplitude
      amplitude *= persistence
      frequency *= lacunarity
    }

    return total / maxValue
  }

  getHeight(x, z) {
    const baseNoise = this.fbm(x * 0.02, z * 0.02, 4, 0.5, 2.0)
    const detailNoise = this.fbm(x * 0.08, z * 0.08, 3, 0.5, 2.0) * 0.3
    const hillNoise = Math.abs(this.noise2D_2(x * 0.01, z * 0.01)) * 4

    const n = baseNoise + detailNoise + hillNoise * 0.3
    const baseHeight = 8
    const heightScale = 10

    return Math.floor(baseHeight + (n + 1) * 0.5 * heightScale)
  }

  getMoisture(x, z) {
    const n = this.moistureNoise(x * 0.015, z * 0.015)
    return (n + 1) * 0.5
  }

  isDesert(x, z) {
    return this.getMoisture(x, z) < 0.3
  }

  placeTree(world, x, y, z) {
    const trunkHeight = 4 + Math.floor(this.rng() * 2)

    for (let i = 0; i < trunkHeight; i++) {
      world.setBlock(x, y + i, z, BlockType.WOOD)
    }

    const leafStart = y + trunkHeight - 1
    const leafRadius = 2

    for (let dy = -1; dy <= 2; dy++) {
      const r = dy === 2 ? 1 : leafRadius
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && this.rng() > 0.5) continue
          const lx = x + dx
          const ly = leafStart + dy
          const lz = z + dz
          if (world.getBlock(lx, ly, lz) === BlockType.AIR) {
            world.setBlock(lx, ly, lz, BlockType.LEAVES)
          }
        }
      }
    }
  }

  placeCactus(world, x, y, z) {
    const height = 2 + Math.floor(this.rng() * 2)
    for (let i = 0; i < height; i++) {
      world.setBlock(x, y + i, z, BlockType.CACTUS)
    }
  }

  generate(world) {
    const waterLevel = 6

    for (let x = 0; x < world.width; x++) {
      for (let z = 0; z < world.depth; z++) {
        const height = this.getHeight(x, z)
        const desert = this.isDesert(x, z)

        for (let y = 0; y < world.height; y++) {
          if (y > height) {
            if (y <= waterLevel) {
              world.setBlock(x, y, z, BlockType.WATER)
            } else {
              world.setBlock(x, y, z, BlockType.AIR)
            }
          } else if (y === height) {
            if (y <= waterLevel) {
              if (desert) {
                world.setBlock(x, y, z, BlockType.SAND)
              } else {
                world.setBlock(x, y, z, BlockType.DIRT)
              }
            } else {
              if (desert) {
                world.setBlock(x, y, z, BlockType.SAND)
              } else {
                world.setBlock(x, y, z, BlockType.GRASS)
              }
            }
          } else if (y > height - 4) {
            if (desert) {
              world.setBlock(x, y, z, BlockType.SAND)
            } else {
              world.setBlock(x, y, z, BlockType.DIRT)
            }
          } else if (y > height - 8) {
            if (this.rng() < 0.1) {
              world.setBlock(x, y, z, BlockType.DIRT)
            } else {
              world.setBlock(x, y, z, BlockType.STONE)
            }
          } else {
            world.setBlock(x, y, z, BlockType.STONE)
          }
        }
      }
    }

    const treeChance = 0.008
    const cactusChance = 0.01

    for (let x = 2; x < world.width - 2; x++) {
      for (let z = 2; z < world.depth - 2; z++) {
        const height = this.getHeight(x, z)
        if (height <= waterLevel) continue

        const topBlock = world.getBlock(x, height, z)
        const desert = this.isDesert(x, z)

        if (!desert && topBlock === BlockType.GRASS) {
          if (this.rng() < treeChance) {
            let clear = true
            for (let dx = -2; dx <= 2 && clear; dx++) {
              for (let dz = -2; dz <= 2 && clear; dz++) {
                if (world.getBlock(x + dx, height + 1, z + dz) !== BlockType.AIR) {
                  clear = false
                }
              }
            }
            if (clear) {
              this.placeTree(world, x, height + 1, z)
            }
          }
        } else if (desert && topBlock === BlockType.SAND) {
          if (this.rng() < cactusChance) {
            let clear = true
            for (let dx = -1; dx <= 1 && clear; dx++) {
              for (let dz = -1; dz <= 1 && clear; dz++) {
                if (dx === 0 && dz === 0) continue
                if (world.isSolid(x + dx, height + 1, z + dz)) {
                  clear = false
                }
              }
            }
            if (clear) {
              this.placeCactus(world, x, height + 1, z)
            }
          }
        }
      }
    }
  }
}
