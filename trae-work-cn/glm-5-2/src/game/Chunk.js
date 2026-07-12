import * as THREE from 'three'
import { BLOCK, BLOCKS, isTransparent } from './blocks.js'

// 区块常量
export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 128

// 6 个面的定义：每个面包含 4 个顶点偏移、法线、以及该面属于哪个方向
// 顶点顺序为逆时针（从面外侧看），Three.js 默认逆时针为正面
// 每个面 4 个顶点组成 2 个三角形：(0,1,2) 和 (0,2,3)
const FACES = [
  { // +x 右
    dir: [1, 0, 0],
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1]
    ],
    tileKey: 'side'
  },
  { // -x 左
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0]
    ],
    tileKey: 'side'
  },
  { // +y 上
    dir: [0, 1, 0],
    corners: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0]
    ],
    tileKey: 'top'
  },
  { // -y 下
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1]
    ],
    tileKey: 'bottom'
  },
  { // +z 前
    dir: [0, 0, 1],
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1]
    ],
    tileKey: 'side'
  },
  { // -z 后
    dir: [0, 0, -1],
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0]
    ],
    tileKey: 'side'
  }
]

// 图集 UV 参数
const TILES_PER_ROW = 16
const ATLAS_ROWS = 2
const EPS = 0.001 // 防 UV 渗漏

// 根据 tile 索引计算 4 个 UV（对应顶点顺序 0,1,2,3）
// 返回 [(u0,v0),(u0,v1),(u1,v1),(u1,v0)]
function tileUV(tileIndex) {
  const col = tileIndex % TILES_PER_ROW
  const row = Math.floor(tileIndex / TILES_PER_ROW)
  const u0 = col / TILES_PER_ROW + EPS
  const u1 = (col + 1) / TILES_PER_ROW - EPS
  const v1 = 1 - row / ATLAS_ROWS - EPS // 图集顶部
  const v0 = 1 - (row + 1) / ATLAS_ROWS + EPS // 图集底部
  return [
    [u0, v0],
    [u0, v1],
    [u1, v1],
    [u1, v0]
  ]
}

// 判断当前方块的面是否需要渲染
// 规则：邻居为 AIR，或邻居透明且与当前方块不同
function shouldRenderFace(cur, nbr) {
  if (nbr === BLOCK.AIR) return true
  if (isTransparent(nbr) && nbr !== cur) return true
  return false
}

// 区块类：存储方块数据并生成渲染网格
export class Chunk {
  constructor(cx, cz) {
    this.cx = cx // 区块坐标 x
    this.cz = cz
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT)
    this.mesh = null // opaque 网格
    this.transparentMesh = null // transparent 网格
    this.dirty = true // 需要重建网格
    this.generated = false // 是否已生成地形
    this.modified = false // 是否被玩家修改过（存档时只保存此类区块）
  }

  // 局部坐标索引：index = x + z*16 + y*256
  index(x, y, z) {
    return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE
  }

  // 获取方块（局部坐标），越界返回 AIR
  getBlock(x, y, z) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) {
      return BLOCK.AIR
    }
    return this.data[this.index(x, y, z)]
  }

  // 设置方块（局部坐标），越界忽略
  setBlock(x, y, z, id) {
    if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT) {
      return
    }
    this.data[this.index(x, y, z)] = id
    // 标记区块已被修改，存档时会持久化
    this.modified = true
  }

  // 生成网格，传入 getGlobalBlock(wx, wy, wz) 查询跨区块邻居
  // 返回 { opaque: BufferGeometry|null, transparent: BufferGeometry|null }
  buildMesh(getGlobalBlock) {
    const opaquePositions = []
    const opaqueNormals = []
    const opaqueUvs = []
    const opaqueIndices = []

    const transPositions = []
    const transNormals = []
    const transUvs = []
    const transIndices = []

    const cx = this.cx
    const cz = this.cz

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const cur = this.data[this.index(x, y, z)]
          if (cur === BLOCK.AIR) continue

          const def = BLOCKS[cur]
          const curTransparent = def.transparent
          // 选择目标顶点数组
          const positions = curTransparent ? transPositions : opaquePositions
          const normals = curTransparent ? transNormals : opaqueNormals
          const uvs = curTransparent ? transUvs : opaqueUvs
          const indices = curTransparent ? transIndices : opaqueIndices

          // 世界坐标（用于查询邻居）
          const wx = cx * CHUNK_SIZE + x
          const wz = cz * CHUNK_SIZE + z

          for (let f = 0; f < 6; f++) {
            const face = FACES[f]
            const nx = wx + face.dir[0]
            const ny = y + face.dir[1]
            const nz = wz + face.dir[2]
            const nbr = getGlobalBlock(nx, ny, nz)

            if (!shouldRenderFace(cur, nbr)) continue

            // 该面使用的 tile 索引
            const tileIndex = def.tiles[face.tileKey]
            const uvs4 = tileUV(tileIndex)

            const startIndex = positions.length / 3
            for (let i = 0; i < 4; i++) {
              const c = face.corners[i]
              positions.push(x + c[0], y + c[1], z + c[2])
              normals.push(face.dir[0], face.dir[1], face.dir[2])
              uvs.push(uvs4[i][0], uvs4[i][1])
            }
            // 两个三角形
            indices.push(
              startIndex, startIndex + 1, startIndex + 2,
              startIndex, startIndex + 2, startIndex + 3
            )
          }
        }
      }
    }

    const opaque = opaquePositions.length > 0 ? buildGeometry(opaquePositions, opaqueNormals, opaqueUvs, opaqueIndices) : null
    const transparent = transPositions.length > 0 ? buildGeometry(transPositions, transNormals, transUvs, transIndices) : null
    return { opaque, transparent }
  }
}

// 从顶点数组构建 BufferGeometry
function buildGeometry(positions, normals, uvs, indices) {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  // 显式计算包围球，确保视锥剔除正常工作
  geo.computeBoundingSphere()
  return geo
}
