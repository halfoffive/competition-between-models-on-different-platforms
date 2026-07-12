import * as THREE from 'three'
import { BLOCK_TYPES, getBlockColor, FACES } from './BlockTypes.js'

// 方块尺寸常量
const BLOCK_SIZE = 1
const CHUNK_SIZE_X = 16
const CHUNK_SIZE_Y = 128
const CHUNK_SIZE_Z = 16

// 每个面的相邻方向偏移
const FACE_NEIGHBORS = [
  { dx: 0, dy: 1, dz: 0, face: FACES.TOP },     // top
  { dx: 0, dy: -1, dz: 0, face: FACES.BOTTOM },  // bottom
  { dx: 0, dy: 0, dz: 1, face: FACES.FRONT },    // front
  { dx: 0, dy: 0, dz: -1, face: FACES.BACK },    // back
  { dx: -1, dy: 0, dz: 0, face: FACES.LEFT },    // left
  { dx: 1, dy: 0, dz: 0, face: FACES.RIGHT },    // right
]

// 每个面的 4 个顶点位置（相对于方块原点 0,0,0）
const FACE_VERTICES = {
  [FACES.TOP]: [
    [0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0],
  ],
  [FACES.BOTTOM]: [
    [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1],
  ],
  [FACES.FRONT]: [
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ],
  [FACES.BACK]: [
    [1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0],
  ],
  [FACES.LEFT]: [
    [0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0],
  ],
  [FACES.RIGHT]: [
    [1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1],
  ],
}

// 每个面的法线
const FACE_NORMALS = {
  [FACES.TOP]: [0, 1, 0],
  [FACES.BOTTOM]: [0, -1, 0],
  [FACES.FRONT]: [0, 0, 1],
  [FACES.BACK]: [0, 0, -1],
  [FACES.LEFT]: [-1, 0, 0],
  [FACES.RIGHT]: [1, 0, 0],
}

export class Chunk {
  /**
   * @param {number} cx - 区块 X 坐标（世界坐标 = cx * 16）
   * @param {number} cz - 区块 Z 坐标（世界坐标 = cz * 16）
   */
  constructor(cx, cz) {
    this.cx = cx
    this.cz = cz
    this.worldX = cx * CHUNK_SIZE_X
    this.worldZ = cz * CHUNK_SIZE_Z

    // 初始化方块数组: blocks[x][y][z]
    this.blocks = Array.from({ length: CHUNK_SIZE_X }, () =>
      Array.from({ length: CHUNK_SIZE_Y }, () =>
        Array(CHUNK_SIZE_Z).fill(BLOCK_TYPES.AIR)
      )
    )

    this.meshGroup = null
    this.isDirty = false
  }

  /**
   * 设置方块类型
   * @param {number} x - 局部坐标 (0-15)
   * @param {number} y - 局部坐标 (0-127)
   * @param {number} z - 局部坐标 (0-15)
   * @param {number} type - 方块类型
   */
  setBlock(x, y, z, type) {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return
    }
    this.blocks[x][y][z] = type
    this.isDirty = true
  }

  /**
   * 获取方块类型
   * @param {number} x - 局部坐标 (0-15)
   * @param {number} y - 局部坐标 (0-127)
   * @param {number} z - 局部坐标 (0-15)
   * @returns {number} 方块类型
   */
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return BLOCK_TYPES.AIR
    }
    return this.blocks[x][y][z]
  }

  /**
   * 检查指定面是否应该被渲染（相邻方块是否为空气）
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} dx
   * @param {number} dy
   * @param {number} dz
   * @returns {boolean}
   */
  _isFaceVisible(x, y, z, dx, dy, dz) {
    const nx = x + dx
    const ny = y + dy
    const nz = z + dz

    // 超出区块边界时，面可见（区块之间由 ChunkManager 处理）
    if (nx < 0 || nx >= CHUNK_SIZE_X || ny < 0 || ny >= CHUNK_SIZE_Y || nz < 0 || nz >= CHUNK_SIZE_Z) {
      return true
    }

    const neighborType = this.blocks[nx][ny][nz]
    // 如果相邻方块是空气或水（水是半透明），该面可见
    return neighborType === BLOCK_TYPES.AIR || neighborType === BLOCK_TYPES.WATER
  }

  /**
   * 构建合并的几何体 mesh
   * 遍历所有非空气方块，为每个可见面构建四边形
   * 使用 BufferGeometry 手动构建顶点，实现面着色
   * @returns {THREE.Group}
   */
  buildMesh() {
    // 清除旧 mesh
    this.dispose()

    // 按方块类型分组收集面数据
    // 为每种类型创建独立的 BufferGeometry 以避免多材质复杂性
    const typeData = {}

    for (let x = 0; x < CHUNK_SIZE_X; x++) {
      for (let y = 0; y < CHUNK_SIZE_Y; y++) {
        for (let z = 0; z < CHUNK_SIZE_Z; z++) {
          const blockType = this.blocks[x][y][z]
          if (blockType === BLOCK_TYPES.AIR) continue

          // 跳过水方块（水单独处理，或使用半透明材质）
          if (blockType === BLOCK_TYPES.WATER) continue

          for (const neighbor of FACE_NEIGHBORS) {
            if (!this._isFaceVisible(x, y, z, neighbor.dx, neighbor.dy, neighbor.dz)) {
              continue
            }

            const face = neighbor.face
            const color = getBlockColor(blockType, face)

            if (!typeData[blockType]) {
              typeData[blockType] = {
                positions: [],
                colors: [],
                normals: [],
                indices: [],
              }
            }

            const data = typeData[blockType]
            const vertexOffset = data.positions.length / 3
            const vertices = FACE_VERTICES[face]
            const normal = FACE_NORMALS[face]

            // 添加 4 个顶点
            for (const v of vertices) {
              data.positions.push(x + v[0], y + v[1], z + v[2])
              data.normals.push(normal[0], normal[1], normal[2])
              // 将 hex 颜色转换为 RGB 分量 (0-1)
              data.colors.push(
                ((color >> 16) & 0xff) / 255,
                ((color >> 8) & 0xff) / 255,
                (color & 0xff) / 255
              )
            }

            // 两个三角形: (0, 1, 2) 和 (0, 2, 3)
            data.indices.push(
              vertexOffset, vertexOffset + 1, vertexOffset + 2,
              vertexOffset, vertexOffset + 2, vertexOffset + 3
            )
          }
        }
      }
    }

    // 为每种方块类型创建 mesh
    this.meshGroup = new THREE.Group()

    for (const [blockType, data] of Object.entries(typeData)) {
      if (data.positions.length === 0) continue

      const geometry = new THREE.BufferGeometry()

      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(data.positions, 3)
      )
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(data.colors, 3)
      )
      geometry.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(data.normals, 3)
      )
      geometry.setIndex(data.indices)
      geometry.computeBoundingSphere()
      geometry.computeBoundingBox()

      // 水方块使用半透明材质
      const isWater = Number(blockType) === BLOCK_TYPES.WATER
      const material = new THREE.MeshLambertMaterial({
        vertexColors: true,
        transparent: isWater,
        opacity: isWater ? 0.65 : 1.0,
        side: THREE.FrontSide,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.meshGroup.add(mesh)
    }

    // 将 group 放置在区块世界坐标处
    this.meshGroup.position.set(this.worldX, 0, this.worldZ)
    this.isDirty = false

    return this.meshGroup
  }

  /**
   * 清理几何体和材质
   */
  dispose() {
    if (this.meshGroup) {
      this.meshGroup.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose()
        }
        if (child.material) {
          child.material.dispose()
        }
      })
      this.meshGroup.clear()
      this.meshGroup = null
    }
  }
}