import { BlockId } from './BlockId'

/** 区块边长 16，高 256 */
export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 256

export interface ChunkKey {
  cx: number
  cz: number
}

export function keyOf(cx: number, cz: number): string {
  return `${cx},${cz}`
}

export function worldToChunk(wx: number, wz: number): ChunkKey {
  return {
    cx: Math.floor(wx / CHUNK_SIZE),
    cz: Math.floor(wz / CHUNK_SIZE),
  }
}

export function chunkToWorld(cx: number, cz: number): { x: number; z: number } {
  return { x: cx * CHUNK_SIZE, z: cz * CHUNK_SIZE }
}

/**
 * 单个区块：保存 16*256*16 的字节体素，外加光照数组。
 * - data: 顶层方块 ID（占一字节）
 * - light: 4 位天空光 + 4 位方块光，存为 0-15
 */
export class Chunk {
  readonly cx: number
  readonly cz: number
  /** 16*256*16 字节方块 ID */
  data: Uint8Array
  /** 16*256*16 字节方块光（0-15） */
  blockLight: Uint8Array
  /** 16*256*16 字节天空光（0-15） */
  skyLight: Uint8Array
  /** 脏标记（自上次渲染以来是否有改动） */
  dirty: boolean = true
  /** 生成器是否完成（所有方块已放置） */
  generated: boolean = false

  constructor(cx: number, cz: number) {
    this.cx = cx
    this.cz = cz
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    this.blockLight = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
    this.skyLight = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE)
  }

  static idx(x: number, y: number, z: number): number {
    return (y * CHUNK_SIZE + z) * CHUNK_SIZE + x
  }

  getBlock(x: number, y: number, z: number): BlockId {
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockId.AIR
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return BlockId.AIR
    return this.data[Chunk.idx(x, y, z)] as BlockId
  }

  setBlock(x: number, y: number, z: number, id: BlockId): void {
    if (y < 0 || y >= CHUNK_HEIGHT) return
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return
    const i = Chunk.idx(x, y, z)
    if (this.data[i] === id) return
    this.data[i] = id
    this.dirty = true
  }

  getSkyLight(x: number, y: number, z: number): number {
    if (y < 0 || y >= CHUNK_HEIGHT) return 0
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0
    return this.skyLight[Chunk.idx(x, y, z)]
  }

  setSkyLight(x: number, y: number, z: number, v: number): void {
    if (y < 0 || y >= CHUNK_HEIGHT) return
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return
    this.skyLight[Chunk.idx(x, y, z)] = v & 0xf
  }

  getBlockLight(x: number, y: number, z: number): number {
    if (y < 0 || y >= CHUNK_HEIGHT) return 0
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return 0
    return this.blockLight[Chunk.idx(x, y, z)]
  }

  setBlockLight(x: number, y: number, z: number, v: number): void {
    if (y < 0 || y >= CHUNK_HEIGHT) return
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return
    this.blockLight[Chunk.idx(x, y, z)] = v & 0xf
  }
}
