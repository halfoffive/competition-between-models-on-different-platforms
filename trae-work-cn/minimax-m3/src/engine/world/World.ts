import { Chunk, CHUNK_HEIGHT, CHUNK_SIZE, keyOf } from './Chunk'
import { WorldGenerator } from './Generator'
import { BlockId } from './BlockId'
import { ChunkRenderer } from '../render/ChunkRenderer'

export interface WorldListener {
  onChunkLoaded(chunk: Chunk): void
  onChunkUnloaded(chunk: Chunk): void
}

/**
 * 世界容器：
 * - 维护已加载区块的字典
 * - 按需请求生成（同步或 worker）
 * - 处理越界访问（邻接区块）并触发异步加载
 */
export class World {
  readonly seed: number
  readonly generator: WorldGenerator
  readonly chunks: Map<string, Chunk> = new Map()
  /** 加载半径（区块） */
  loadRadius: number = 4
  /** 卸载半径 */
  unloadRadius: number = 6
  private listeners: WorldListener[] = []
  private pendingRequests: Set<string> = new Set()

  constructor(seed: number) {
    this.seed = seed
    this.generator = new WorldGenerator({ seed })
  }

  addListener(l: WorldListener) {
    this.listeners.push(l)
    return () => {
      this.listeners = this.listeners.filter(x => x !== l)
    }
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(keyOf(cx, cz))
  }

  /** 同步生成（用于初始 / debug） */
  generateChunkSync(cx: number, cz: number): Chunk {
    const key = keyOf(cx, cz)
    let chunk = this.chunks.get(key)
    if (chunk && chunk.generated) return chunk
    if (!chunk) {
      chunk = new Chunk(cx, cz)
      this.chunks.set(key, chunk)
    }
    this.generator.generateChunk(chunk)
    this.listeners.forEach(l => l.onChunkLoaded(chunk!))
    return chunk
  }

  /** 异步请求：先返回现有 / 临时区块，再后台生成 */
  requestChunk(cx: number, cz: number): Chunk {
    const key = keyOf(cx, cz)
    let chunk = this.chunks.get(key)
    if (chunk) return chunk
    chunk = new Chunk(cx, cz)
    this.chunks.set(key, chunk)
    this.pendingRequests.add(key)
    // 这里使用 setTimeout 模拟 worker 异步
    queueMicrotask(() => {
      if (!this.pendingRequests.has(key)) return
      this.pendingRequests.delete(key)
      this.generator.generateChunk(chunk!)
      this.listeners.forEach(l => l.onChunkLoaded(chunk!))
    })
    return chunk
  }

  /** 邻近方块查询（跨区块） */
  getBlock(wx: number, wy: number, wz: number): BlockId {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockId.AIR
    const cx = Math.floor(wx / CHUNK_SIZE)
    const cz = Math.floor(wz / CHUNK_SIZE)
    const chunk = this.getChunk(cx, cz)
    if (!chunk || !chunk.generated) return BlockId.AIR
    return chunk.getBlock(((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE, wy, ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE)
  }

  /** 在跨区块处写方块 */
  setBlock(wx: number, wy: number, wz: number, id: BlockId): boolean {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return false
    const cx = Math.floor(wx / CHUNK_SIZE)
    const cz = Math.floor(wz / CHUNK_SIZE)
    const chunk = this.getChunk(cx, cz)
    if (!chunk || !chunk.generated) return false
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
    const before = chunk.getBlock(lx, wy, lz)
    if (before === id) return false
    chunk.setBlock(lx, wy, lz, id)
    chunk.dirty = true
    // 邻居脏标记
    if (lx === 0) this.markNeighborDirty(cx - 1, cz)
    if (lx === CHUNK_SIZE - 1) this.markNeighborDirty(cx + 1, cz)
    if (lz === 0) this.markNeighborDirty(cx, cz - 1)
    if (lz === CHUNK_SIZE - 1) this.markNeighborDirty(cx, cz + 1)
    // 天空光更新
    this.updateSkyLightAround(wx, wy, wz, before, id)
    return true
  }

  private markNeighborDirty(cx: number, cz: number) {
    const c = this.getChunk(cx, cz)
    if (c) c.dirty = true
  }

  private updateSkyLightAround(wx: number, wy: number, wz: number, before: BlockId, after: BlockId) {
    // 简化处理：如果置入不透明方块则减少其周围天空光；
    // 如果移除不透明方块则增加。完整光照传播留作后续。
    if (this.getBlock(wx, wy, wz) === BlockId.AIR) return
    // 简化：直接标记所有相关区块脏
    const cx = Math.floor(wx / CHUNK_SIZE)
    const cz = Math.floor(wz / CHUNK_SIZE)
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      const c = this.getChunk(cx + dx, cz + dz)
      if (c) c.dirty = true
    }
  }

  /** 玩家移动后调用：按需加载/卸载 */
  updateAroundPlayer(px: number, pz: number) {
    const centerCx = Math.floor(px / CHUNK_SIZE)
    const centerCz = Math.floor(pz / CHUNK_SIZE)
    const r = this.loadRadius
    // 加载
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (dx * dx + dz * dz > r * r) continue
        this.requestChunk(centerCx + dx, centerCz + dz)
      }
    }
    // 卸载
    const ur = this.unloadRadius
    for (const [key, chunk] of this.chunks) {
      const ddx = chunk.cx - centerCx
      const ddz = chunk.cz - centerCz
      if (Math.abs(ddx) > ur || Math.abs(ddz) > ur) {
        this.chunks.delete(key)
        this.listeners.forEach(l => l.onChunkUnloaded(chunk))
      }
    }
  }

  /** 获取所有需要重新构建 mesh 的区块 */
  getDirtyChunks(): Chunk[] {
    const out: Chunk[] = []
    for (const c of this.chunks.values()) {
      if (c.dirty) out.push(c)
    }
    return out
  }

  markAllClean() {
    for (const c of this.chunks.values()) c.dirty = false
  }

  // ---- 持久化 ----
  serialize(): string {
    const obj = {
      seed: this.seed,
      chunks: Array.from(this.chunks.values()).map(c => ({
        cx: c.cx,
        cz: c.cz,
        data: Array.from(c.data),
        blockLight: Array.from(c.blockLight),
        skyLight: Array.from(c.skyLight),
      })),
    }
    // 二进制序列化以减小体积
    return JSON.stringify(obj)
  }

  static deserialize(json: string, renderer?: ChunkRenderer): World {
    const obj = JSON.parse(json)
    const w = new World(obj.seed)
    for (const cd of obj.chunks) {
      const c = new Chunk(cd.cx, cd.cz)
      c.data = new Uint8Array(cd.data)
      c.blockLight = new Uint8Array(cd.blockLight)
      c.skyLight = new Uint8Array(cd.skyLight)
      c.generated = true
      c.dirty = true
      w.chunks.set(keyOf(cd.cx, cd.cz), c)
    }
    return w
  }
}
