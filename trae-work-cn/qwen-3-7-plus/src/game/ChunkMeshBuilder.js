import * as THREE from 'three'
import { BlockType, BlockData } from './Block.js'
import { CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk.js'

export class ChunkMeshBuilder {
  constructor(chunk, world, textureAtlas) {
    this.chunk = chunk
    this.world = world
    this.textureAtlas = textureAtlas
  }

  // 构建区块网格
  buildMesh() {
    const positions = []
    const normals = []
    const uvs = []
    const indices = []

    let vertexCount = 0

    // 遍历区块中的每个方块
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const blockType = this.chunk.getBlock(x, y, z)
          
          if (blockType === BlockType.AIR) continue

          const blockData = BlockData[blockType]
          if (!blockData) continue

          const worldX = this.chunk.chunkX * CHUNK_SIZE + x
          const worldZ = this.chunk.chunkZ * CHUNK_SIZE + z

          // 检查6个面，只生成可见面
          // 上 (+Y)
          if (this.shouldRenderFace(x, y + 1, z, worldX, worldZ, blockType)) {
            this.addTopFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }

          // 下 (-Y)
          if (y > 0 && this.shouldRenderFace(x, y - 1, z, worldX, worldZ, blockType)) {
            this.addBottomFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }

          // 前 (+Z)
          if (this.shouldRenderFace(x, y, z + 1, worldX, worldZ, blockType)) {
            this.addFrontFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }

          // 后 (-Z)
          if (this.shouldRenderFace(x, y, z - 1, worldX, worldZ, blockType)) {
            this.addBackFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }

          // 右 (+X)
          if (this.shouldRenderFace(x + 1, y, z, worldX, worldZ, blockType)) {
            this.addRightFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }

          // 左 (-X)
          if (this.shouldRenderFace(x - 1, y, z, worldX, worldZ, blockType)) {
            this.addLeftFace(positions, normals, uvs, indices, x, y, z, blockType, vertexCount)
            vertexCount += 4
          }
        }
      }
    }

    if (positions.length === 0) return null

    // 创建几何体
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)

    // 创建材质
    const material = new THREE.MeshLambertMaterial({
      map: this.textureAtlas.texture,
      side: THREE.FrontSide
    })

    // 创建网格
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      this.chunk.chunkX * CHUNK_SIZE,
      0,
      this.chunk.chunkZ * CHUNK_SIZE
    )

    return mesh
  }

  // 检查是否应该渲染某个面
  shouldRenderFace(localX, y, localZ, worldX, worldZ, currentBlockType) {
    // 边界检查
    if (y < 0 || y >= CHUNK_HEIGHT) return false

    // 检查相邻方块
    let neighborBlock
    if (localX >= 0 && localX < CHUNK_SIZE && localZ >= 0 && localZ < CHUNK_SIZE) {
      // 同一个区块内
      neighborBlock = this.chunk.getBlock(localX, y, localZ)
    } else {
      // 需要查询相邻区块
      const adjChunkX = this.chunk.chunkX + Math.floor(localX / CHUNK_SIZE)
      const adjChunkZ = this.chunk.chunkZ + Math.floor(localZ / CHUNK_SIZE)
      const adjLocalX = ((localX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
      const adjLocalZ = ((localZ % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE
      
      const adjChunk = this.world.getChunk(adjChunkX, adjChunkZ)
      if (!adjChunk) return true // 相邻区块未加载，渲染面
      neighborBlock = adjChunk.getBlock(adjLocalX, y, adjLocalZ)
    }

    const currentData = BlockData[currentBlockType]
    const neighborData = BlockData[neighborBlock]

    // 如果相邻方块是空气，渲染面
    if (neighborBlock === BlockType.AIR) return true

    // 如果当前方块不透明，相邻方块透明，渲染面
    if (!currentData.transparent && neighborData.transparent) return true

    // 如果当前方块和相邻方块都透明但类型不同，渲染面
    if (currentData.transparent && neighborData.transparent && currentBlockType !== neighborBlock) return true

    return false
  }

  addTopFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.top)

    positions.push(
      x, y + 1, z,     // 0
      x + 1, y + 1, z, // 1
      x + 1, y + 1, z + 1, // 2
      x, y + 1, z + 1  // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(0, 1, 0)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }

  addBottomFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.bottom)

    positions.push(
      x, y, z + 1,     // 0
      x + 1, y, z + 1, // 1
      x + 1, y, z,     // 2
      x, y, z          // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(0, -1, 0)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }

  addFrontFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.side)

    positions.push(
      x, y, z + 1,     // 0
      x + 1, y, z + 1, // 1
      x + 1, y + 1, z + 1, // 2
      x, y + 1, z + 1  // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(0, 0, 1)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }

  addBackFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.side)

    positions.push(
      x + 1, y, z,     // 0
      x, y, z,         // 1
      x, y + 1, z,     // 2
      x + 1, y + 1, z  // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(0, 0, -1)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }

  addRightFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.side)

    positions.push(
      x + 1, y, z + 1, // 0
      x + 1, y, z,     // 1
      x + 1, y + 1, z, // 2
      x + 1, y + 1, z + 1 // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(1, 0, 0)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }

  addLeftFace(positions, normals, uvs, indices, x, y, z, blockType, vertexIndex) {
    const tileInfo = this.textureAtlas.tileMap.get(blockType)
    const uv = this.textureAtlas.getUV(tileInfo.side)

    positions.push(
      x, y, z,         // 0
      x, y, z + 1,     // 1
      x, y + 1, z + 1, // 2
      x, y + 1, z      // 3
    )

    for (let i = 0; i < 4; i++) {
      normals.push(-1, 0, 0)
    }

    uvs.push(
      uv.u0, uv.v0,
      uv.u1, uv.v0,
      uv.u1, uv.v1,
      uv.u0, uv.v1
    )

    indices.push(
      vertexIndex, vertexIndex + 1, vertexIndex + 2,
      vertexIndex, vertexIndex + 2, vertexIndex + 3
    )
  }
}
