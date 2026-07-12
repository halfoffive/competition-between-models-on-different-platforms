import { Chunk } from './Chunk.js'
import { BLOCK_TYPES } from './BlockTypes.js'
import { TerrainGenerator } from './TerrainGenerator.js'

export class ChunkManager {
  /**
   * @param {THREE.Scene} scene - Three.js 场景
   */
  constructor(scene) {
    this.scene = scene
    this.chunks = new Map() // key: "cx,cz" -> Chunk
    this.terrainGenerator = new TerrainGenerator(42)
    this.renderRadius = 4
  }

  /**
   * 根据玩家位置更新区块加载/卸载
   * @param {number} playerX - 玩家世界 X 坐标
   * @param {number} playerZ - 玩家世界 Z 坐标
   * @param {number} renderRadius - 渲染半径（区块数）
   */
  update(playerX, playerZ, renderRadius = 4) {
    this.renderRadius = renderRadius

    const playerCX = Math.floor(playerX / 16)
    const playerCZ = Math.floor(playerZ / 16)

    // 加载新区块
    for (let dx = -renderRadius; dx <= renderRadius; dx++) {
      for (let dz = -renderRadius; dz <= renderRadius; dz++) {
        const cx = playerCX + dx
        const cz = playerCZ + dz
        const key = `${cx},${cz}`

        if (!this.chunks.has(key)) {
          this._loadChunk(cx, cz)
        }
      }
    }

    // 卸载超出范围的区块
    const toRemove = []
    for (const [key, chunk] of this.chunks) {
      const cx = chunk.cx
      const cz = chunk.cz
      if (
        Math.abs(cx - playerCX) > renderRadius + 1 ||
        Math.abs(cz - playerCZ) > renderRadius + 1
      ) {
        toRemove.push(key)
      }
    }

    for (const key of toRemove) {
      this._unloadChunk(key)
    }
  }

  /**
   * 加载区块
   * @param {number} cx
   * @param {number} cz
   */
  _loadChunk(cx, cz) {
    const key = `${cx},${cz}`
    if (this.chunks.has(key)) return

    const chunk = new Chunk(cx, cz)

    // 使用地形生成器填充区块数据
    this.terrainGenerator.generateChunkData(chunk)

    // 构建 mesh 并添加到场景
    chunk.buildMesh()
    if (chunk.meshGroup) {
      this.scene.add(chunk.meshGroup)
    }

    this.chunks.set(key, chunk)
  }

  /**
   * 卸载区块
   * @param {string} key
   */
  _unloadChunk(key) {
    const chunk = this.chunks.get(key)
    if (!chunk) return

    if (chunk.meshGroup) {
      this.scene.remove(chunk.meshGroup)
    }
    chunk.dispose()
    this.chunks.delete(key)
  }

  /**
   * 获取世界坐标处的方块类型
   * @param {number} worldX
   * @param {number} worldY
   * @param {number} worldZ
   * @returns {number} 方块类型
   */
  getBlock(worldX, worldY, worldZ) {
    const cx = Math.floor(worldX / 16)
    const cz = Math.floor(worldZ / 16)
    const key = `${cx},${cz}`
    const chunk = this.chunks.get(key)

    if (!chunk) return BLOCK_TYPES.AIR

    // 处理负坐标的取模
    const lx = ((worldX % 16) + 16) % 16
    const lz = ((worldZ % 16) + 16) % 16

    if (worldY < 0 || worldY >= 128) return BLOCK_TYPES.AIR

    return chunk.getBlock(Math.floor(lx), Math.floor(worldY), Math.floor(lz))
  }

  /**
   * 设置世界坐标处的方块，并重建对应区块的 mesh
   * @param {number} worldX
   * @param {number} worldY
   * @param {number} worldZ
   * @param {number} type - 方块类型
   */
  setBlock(worldX, worldY, worldZ, type) {
    const cx = Math.floor(worldX / 16)
    const cz = Math.floor(worldZ / 16)
    const key = `${cx},${cz}`
    const chunk = this.chunks.get(key)

    if (!chunk) return

    const lx = ((worldX % 16) + 16) % 16
    const lz = ((worldZ % 16) + 16) % 16

    if (worldY < 0 || worldY >= 128) return

    chunk.setBlock(Math.floor(lx), Math.floor(worldY), Math.floor(lz), type)

    // 重建 mesh
    if (chunk.meshGroup) {
      this.scene.remove(chunk.meshGroup)
    }
    chunk.dispose()
    chunk.buildMesh()
    if (chunk.meshGroup) {
      this.scene.add(chunk.meshGroup)
    }
  }

  /**
   * 获取所有已加载的区块
   * @returns {Map<string, Chunk>}
   */
  getLoadedChunks() {
    return this.chunks
  }

  /**
   * 清理所有区块
   */
  dispose() {
    for (const [key, chunk] of this.chunks) {
      if (chunk.meshGroup) {
        this.scene.remove(chunk.meshGroup)
      }
      chunk.dispose()
    }
    this.chunks.clear()
  }
}