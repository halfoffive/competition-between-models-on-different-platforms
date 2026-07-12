import { createNoise2D, type NoiseFunction2D } from 'simplex-noise'
import { BlockType } from '@/blocks/BlockType'
import {
  CHUNK_SIZE,
  CHUNK_HEIGHT,
  WATER_LEVEL,
  chunkKey,
  worldToChunk,
  type ChunkCoord,
} from './Chunk'

function blockKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = Math.sin(s * 12.9898 + 78.233) * 43758.5453
    return s - Math.floor(s)
  }
}

export class World {
  private blocks = new Map<string, BlockType>()
  private modifiedBlocks = new Set<string>()
  private generatedChunks = new Set<string>()
  private noise: NoiseFunction2D
  private seed: number

  constructor(seed = Math.random()) {
    this.seed = seed
    this.noise = createNoise2D(seededRandom(seed))
  }

  getSeed(): number {
    return this.seed
  }

  setSeed(seed: number): void {
    this.seed = seed
    this.noise = createNoise2D(seededRandom(seed))
    this.blocks.clear()
    this.modifiedBlocks.clear()
    this.generatedChunks.clear()
  }

  getBlock(x: number, y: number, z: number): BlockType {
    return this.blocks.get(blockKey(x, y, z)) ?? BlockType.Air
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (type === BlockType.Air) {
      this.blocks.delete(blockKey(x, y, z))
      return
    }
    this.blocks.set(blockKey(x, y, z), type)
  }

  removeBlock(x: number, y: number, z: number): void {
    this.blocks.delete(blockKey(x, y, z))
  }

  setBlockModified(x: number, y: number, z: number, type: BlockType): void {
    const key = blockKey(x, y, z)
    if (type === BlockType.Air) {
      this.blocks.delete(key)
    } else {
      this.blocks.set(key, type)
    }
    this.modifiedBlocks.add(key)
  }

  removeBlockModified(x: number, y: number, z: number): void {
    const key = blockKey(x, y, z)
    this.blocks.delete(key)
    this.modifiedBlocks.add(key)
  }

  getModifiedBlocks(): [string, BlockType][] {
    return Array.from(this.modifiedBlocks)
      .map((key) => [key, this.blocks.get(key) ?? BlockType.Air] as [string, BlockType])
      .filter(([, type]) => type !== BlockType.Air)
  }

  clearModifiedBlocks(): void {
    this.modifiedBlocks.clear()
  }

  applyModifiedBlocks(entries: [string, BlockType][]): void {
    for (const [key, type] of entries) {
      if (type === BlockType.Air) {
        this.blocks.delete(key)
      } else {
        this.blocks.set(key, type)
      }
      this.modifiedBlocks.add(key)
    }
  }

  isChunkGenerated(cx: number, cz: number): boolean {
    return this.generatedChunks.has(chunkKey(cx, cz))
  }

  markChunkGenerated(cx: number, cz: number): void {
    this.generatedChunks.add(chunkKey(cx, cz))
  }

  getGeneratedChunks(): ChunkCoord[] {
    return Array.from(this.generatedChunks).map((key) => {
      const [x, z] = key.split(',').map(Number)
      return { x, z }
    })
  }

  generateChunk(cx: number, cz: number): void {
    if (this.isChunkGenerated(cx, cz)) return
    const baseX = cx * CHUNK_SIZE
    const baseZ = cz * CHUNK_SIZE

    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = baseX + lx
        const wz = baseZ + lz
        const height = this.getTerrainHeight(wx, wz)
        this.generateColumn(wx, wz, height)
      }
    }

    this.generateTrees(cx, cz)
    this.markChunkGenerated(cx, cz)
  }

  getTerrainHeight(x: number, z: number): number {
    const scale1 = 0.01
    const scale2 = 0.03
    const scale3 = 0.09
    const n1 = this.noise(x * scale1, z * scale1)
    const n2 = this.noise(x * scale2 + 100, z * scale2 + 100) * 0.5
    const n3 = this.noise(x * scale3 + 200, z * scale3 + 200) * 0.25
    const value = n1 + n2 + n3
    const normalized = (value + 1) / 2
    const minHeight = 20
    const maxHeight = 60
    return Math.floor(minHeight + normalized * (maxHeight - minHeight))
  }

  private generateColumn(x: number, z: number, height: number): void {
    const surface = Math.max(1, height)

    for (let y = 0; y <= surface && y < CHUNK_HEIGHT; y++) {
      if (y === surface) {
        this.setBlock(x, y, z, BlockType.Grass)
      } else if (y >= surface - 3) {
        this.setBlock(x, y, z, BlockType.Dirt)
      } else {
        this.setBlock(x, y, z, BlockType.Stone)
      }
    }

    if (surface < WATER_LEVEL - 1) {
      for (let y = surface + 1; y <= WATER_LEVEL && y < CHUNK_HEIGHT; y++) {
        if (this.getBlock(x, y, z) === BlockType.Air) {
          this.setBlock(x, y, z, BlockType.Water)
        }
      }
      for (let y = surface - 2; y <= surface && y >= 0; y++) {
        if (this.getBlock(x, y, z) === BlockType.Grass || this.getBlock(x, y, z) === BlockType.Dirt) {
          this.setBlock(x, y, z, BlockType.Sand)
        }
      }
    }

    if (Math.random() < 0.005 && surface > WATER_LEVEL + 2) {
      const veinY = Math.floor(Math.random() * (surface - 10)) + 5
      this.setBlock(x, veinY, z, BlockType.DiamondOre)
    }
  }

  private generateTrees(cx: number, cz: number): void {
    const baseX = cx * CHUNK_SIZE
    const baseZ = cz * CHUNK_SIZE

    for (let lx = 2; lx < CHUNK_SIZE - 2; lx++) {
      for (let lz = 2; lz < CHUNK_SIZE - 2; lz++) {
        if (Math.random() > 0.04) continue
        const wx = baseX + lx
        const wz = baseZ + lz
        const height = this.getTerrainHeight(wx, wz)
        if (height <= WATER_LEVEL) continue

        const groundY = height + 1
        if (groundY + 6 >= CHUNK_HEIGHT) continue
        if (this.getBlock(wx, groundY - 1, wz) !== BlockType.Grass) continue

        const trunkHeight = 4 + Math.floor(Math.random() * 2)
        for (let y = 0; y < trunkHeight; y++) {
          this.setBlock(wx, groundY + y, wz, BlockType.Wood)
        }

        const leafStart = groundY + trunkHeight - 2
        const leafTop = groundY + trunkHeight + 1
        for (let ly = leafStart; ly <= leafTop; ly++) {
          const radius = ly === leafTop ? 1 : ly === leafStart ? 2 : 2
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
              if (dx === 0 && dz === 0 && ly < groundY + trunkHeight) continue
              if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() < 0.3) continue
              this.setBlock(wx + dx, ly, wz + dz, BlockType.Leaves)
            }
          }
        }
      }
    }
  }

  getChunksAround(centerX: number, centerZ: number, radius: number): ChunkCoord[] {
    const center = worldToChunk(centerX, centerZ)
    const chunks: ChunkCoord[] = []
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        chunks.push({ x: center.x + dx, z: center.z + dz })
      }
    }
    return chunks
  }

  serialize(): string {
    const data = {
      seed: this.seed,
      blocks: Array.from(this.blocks.entries()),
      generatedChunks: Array.from(this.generatedChunks),
    }
    return JSON.stringify(data)
  }

  load(serialized: string): void {
    try {
      const data = JSON.parse(serialized)
      this.seed = data.seed ?? this.seed
      this.noise = createNoise2D(seededRandom(this.seed))
      this.blocks = new Map(data.blocks ?? [])
      this.generatedChunks = new Set(data.generatedChunks ?? [])
    } catch {
      // ignore invalid save data
    }
  }
}
