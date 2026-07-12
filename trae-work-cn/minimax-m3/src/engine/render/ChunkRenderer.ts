import * as THREE from 'three'
import { BlockId, isBlockIdFluid, isBlockIdSolid, isBlockIdTransparent } from '../world/BlockId'
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from '../world/Chunk'
import { World } from '../world/World'
import { TextureAtlas } from './TextureAtlas'

interface FaceDef {
  dir: [number, number, number]
  name: 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west'
  corners: [number, number, number][]
}

const FACES: FaceDef[] = [
  { dir: [0, 1, 0], name: 'top', corners: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]] },
  { dir: [0, -1, 0], name: 'bottom', corners: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]] },
  { dir: [0, 0, 1], name: 'south', corners: [[0, 0, 1], [0, 1, 1], [1, 1, 1], [1, 0, 1]] },
  { dir: [0, 0, -1], name: 'north', corners: [[1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 0]] },
  { dir: [1, 0, 0], name: 'east', corners: [[1, 0, 1], [1, 1, 1], [1, 1, 0], [1, 0, 0]] },
  { dir: [-1, 0, 0], name: 'west', corners: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]] },
]

const UV_CORNERS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * 区块网格构建器。每个区块生成两个 mesh：
 * - 不透明（石头、土、沙、木、矿石等）
 * - 透明（水、玻璃、树叶、火把、花、草）
 */
export class MeshBuilder {
  buildChunk(chunk: Chunk, world: World, atlas: TextureAtlas): { opaque: THREE.BufferGeometry; transparent: THREE.BufferGeometry } {
    const op: number[] = [] // positions
    const ou: number[] = [] // uvs
    const oc: number[] = [] // colors (per face, baked)
    const oi: number[] = [] // indices
    let opCount = 0

    const tp: number[] = []
    const tu: number[] = []
    const tc: number[] = []
    const ti: number[] = []
    let tpCount = 0

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const id = chunk.getBlock(x, y, z) as BlockId
          if (id === BlockId.AIR) continue
          this.emitBlock(chunk, world, atlas, x, y, z, id, op, ou, oc, oi, () => opCount, () => { opCount += 4 }, () => opCount,
            tp, tu, tc, ti, () => tpCount, () => { tpCount += 4 }, () => tpCount)
        }
      }
    }

    const opaque = this.makeGeom(op, ou, oc, oi)
    const transparent = this.makeGeom(tp, tu, tc, ti)
    return { opaque, transparent }
  }

  private makeGeom(pos: number[], uv: number[], col: number[], idx: number[]): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    if (idx.length > 0) g.setIndex(idx)
    g.computeBoundingSphere()
    return g
  }

  private getBlockSafe(world: World, chunk: Chunk, x: number, y: number, z: number): BlockId {
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockId.AIR
    if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
      return chunk.getBlock(x, y, z)
    }
    return world.getBlock(chunk.cx * CHUNK_SIZE + x, y, chunk.cz * CHUNK_SIZE + z)
  }

  private getLightSafe(world: World, chunk: Chunk, x: number, y: number, z: number): number {
    if (y < 0 || y >= CHUNK_HEIGHT) return 15
    if (x >= 0 && x < CHUNK_SIZE && z >= 0 && z < CHUNK_SIZE) {
      return Math.max(chunk.getSkyLight(x, y, z), chunk.getBlockLight(x, y, z))
    }
    // 跨区块：按位置估算（暂取 15）
    return 15
  }

  private emitBlock(
    chunk: Chunk, world: World, atlas: TextureAtlas,
    x: number, y: number, z: number, id: BlockId,
    op: number[], ou: number[], oc: number[], oi: number[],
    opCountGet: () => number, opCountInc: () => void, opCountNow: () => number,
    tp: number[], tu: number[], tc: number[], ti: number[],
    tpCountGet: () => number, tpCountInc: () => void, tpCountNow: () => number,
  ) {
    const tex = atlas.textures.get(id)
    if (!tex) return
    const isFluid = isBlockIdFluid(id)
    const isCross = id === BlockId.TORCH || id === BlockId.FLOWER_RED || id === BlockId.FLOWER_YELLOW || id === BlockId.TALL_GRASS

    if (isCross) {
      this.emitCross(world, chunk, atlas, x, y, z, id, tex.top, tp, tu, tc, ti, tpCountGet, tpCountInc)
      return
    }

    for (let f = 0; f < FACES.length; f++) {
      const face = FACES[f]
      const nx = x + face.dir[0]
      const ny = y + face.dir[1]
      const nz = z + face.dir[2]
      const neighbor = this.getBlockSafe(world, chunk, nx, ny, nz)
      if (!this.shouldDrawFace(neighbor, isFluid, face.name, id)) continue

      let texIndex: number
      if (face.name === 'top') texIndex = tex.top
      else if (face.name === 'bottom') texIndex = tex.bottom
      else texIndex = tex.side

      const light = this.getLightSafe(world, chunk, nx, ny, nz)
      const lightFactor = 0.45 + 0.55 * (light / 15)
      // 流体颜色
      let r = 1, g = 1, b = 1
      if (id === BlockId.WATER) { r = 0.4; g = 0.55; b = 0.95 }
      else if (id === BlockId.LAVA) { r = 1.0; g = 0.55; b = 0.18 }

      const isTransparent = isBlockIdTransparent(id) || isFluid
      if (isTransparent) {
        this.emitFace(face, texIndex, atlas, x, y, z, lightFactor, r, g, b, tp, tu, tc, ti, tpCountGet, tpCountInc)
      } else {
        this.emitFace(face, texIndex, atlas, x, y, z, lightFactor, r, g, b, op, ou, oc, oi, opCountGet, opCountInc)
      }
    }
  }

  private shouldDrawFace(neighbor: BlockId, isFluid: boolean, faceName: string, self: BlockId): boolean {
    if (isFluid) {
      if (faceName === 'top') return true
      if (neighbor === BlockId.AIR) return true
      return false
    }
    if (neighbor === BlockId.AIR) return true
    // 透明邻居：仅当自方块不是透明或不透明于邻居时显示
    if (isBlockIdTransparent(neighbor)) {
      // 玻璃与玻璃之间不画
      if (neighbor === self) return false
      return true
    }
    return false
  }

  private emitFace(
    face: FaceDef, texIndex: number, atlas: TextureAtlas,
    x: number, y: number, z: number,
    light: number, r: number, g: number, b: number,
    posArr: number[], uvArr: number[], colArr: number[], idxArr: number[],
    countGet: () => number, countInc: () => void,
  ) {
    const [u0, v0, u1, v1] = atlas.getUV(texIndex)
    const startIdx = countGet()
    for (let i = 0; i < 4; i++) {
      const c = face.corners[i]
      posArr.push(c[0] + x, c[1] + y, c[2] + z)
      uvArr.push(u0 + UV_CORNERS[i][0] * (u1 - u0), v0 + UV_CORNERS[i][1] * (v1 - v0))
      colArr.push(r * light, g * light, b * light)
    }
    idxArr.push(startIdx, startIdx + 1, startIdx + 2, startIdx, startIdx + 2, startIdx + 3)
    countInc()
  }

  private emitCross(
    world: World, chunk: Chunk, atlas: TextureAtlas,
    x: number, y: number, z: number, id: BlockId, texIndex: number,
    posArr: number[], uvArr: number[], colArr: number[], idxArr: number[],
    countGet: () => number, countInc: () => void,
  ) {
    const [u0, v0, u1, v1] = atlas.getUV(texIndex)
    const h = id === BlockId.TORCH ? 0.6 : 0.6
    const light = this.getLightSafe(world, chunk, x, y + 1, z)
    const lf = 0.7 + 0.3 * (light / 15)
    const r = 1, g = 1, b = 1
    const planes: [number, number, number][][] = [
      [[0, 0, 0], [1, 0, 1], [1, h, 1], [0, h, 0]],
      [[1, 0, 0], [0, 0, 1], [0, h, 1], [1, h, 0]],
    ]
    for (const plane of planes) {
      const startIdx = countGet()
      for (let i = 0; i < 4; i++) {
        posArr.push(plane[i][0] + x, plane[i][1] + y, plane[i][2] + z)
        uvArr.push(u0 + UV_CORNERS[i][0] * (u1 - u0), v0 + UV_CORNERS[i][1] * (v1 - v0))
        colArr.push(r * lf, g * lf, b * lf)
      }
      idxArr.push(startIdx, startIdx + 1, startIdx + 2, startIdx, startIdx + 2, startIdx + 3)
      countInc()
    }
  }
}

/**
 * Three.js 渲染器封装。管理场景、相机、灯光、雾、天空盒（简单）、区块网格。
 */
export class ChunkRenderer {
  readonly scene: THREE.Scene
  readonly camera: THREE.PerspectiveCamera
  readonly renderer: THREE.WebGLRenderer
  readonly atlas: TextureAtlas
  readonly world: World
  private meshes: Map<string, THREE.Mesh> = new Map()
  private transparentMeshes: Map<string, THREE.Mesh> = new Map()
  private builder = new MeshBuilder()
  private building: Set<string> = new Set()
  private prevTime = performance.now()
  private frameTimes: number[] = []
  fps: number = 0
  worldTime: number = 6000
  private ambient: THREE.AmbientLight
  private sun: THREE.DirectionalLight
  private atlasTexture: THREE.Texture
  /** 选中方块外框 */
  private selectionBox: THREE.LineSegments
  private breakOverlay: THREE.Mesh

  constructor(world: World, canvas: HTMLCanvasElement) {
    this.world = world
    this.atlas = new TextureAtlas()
    this.atlasTexture = new THREE.Texture(this.atlas.canvas)
    this.atlasTexture.magFilter = THREE.NearestFilter
    this.atlasTexture.minFilter = THREE.NearestFilter
    this.atlasTexture.generateMipmaps = false
    this.atlasTexture.needsUpdate = true

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb)
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 220)

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x87ceeb)

    this.ambient = new THREE.AmbientLight(0xffffff, 0.55)
    this.scene.add(this.ambient)
    this.sun = new THREE.DirectionalLight(0xffffff, 0.9)
    this.sun.position.set(50, 80, 30)
    this.scene.add(this.sun)

    // 选中方块外框
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002))
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, depthTest: false, transparent: true, opacity: 0.7 })
    this.selectionBox = new THREE.LineSegments(edges, lineMat)
    this.selectionBox.visible = false
    this.selectionBox.renderOrder = 1000
    this.scene.add(this.selectionBox)

    // 破坏进度叠加
    const overlayGeom = new THREE.BoxGeometry(1.005, 1.005, 1.005)
    const overlayMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })
    this.breakOverlay = new THREE.Mesh(overlayGeom, overlayMat)
    this.breakOverlay.visible = false
    this.breakOverlay.renderOrder = 999
    this.scene.add(this.breakOverlay)
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  buildChunkMesh(chunk: Chunk) {
    const key = `${chunk.cx},${chunk.cz}`
    if (this.building.has(key)) return
    this.building.add(key)
    queueMicrotask(() => {
      try {
        const { opaque, transparent } = this.builder.buildChunk(chunk, this.world, this.atlas)
        this.replaceMesh(key, opaque, transparent)
        chunk.dirty = false
      } finally {
        this.building.delete(key)
      }
    })
  }

  private replaceMesh(key: string, opaque: THREE.BufferGeometry, transparent: THREE.BufferGeometry) {
    const old = this.meshes.get(key)
    if (old) { this.scene.remove(old); old.geometry.dispose(); (old.material as THREE.Material).dispose() }
    const oldT = this.transparentMeshes.get(key)
    if (oldT) { this.scene.remove(oldT); oldT.geometry.dispose(); (oldT.material as THREE.Material).dispose() }

    const matOpaque = new THREE.MeshLambertMaterial({ vertexColors: true, map: this.atlasTexture })
    const mesh = new THREE.Mesh(opaque, matOpaque)
    mesh.frustumCulled = true
    this.scene.add(mesh)
    this.meshes.set(key, mesh)

    if (transparent.attributes.position && (transparent.attributes.position as THREE.BufferAttribute).count > 0) {
      const matT = new THREE.MeshLambertMaterial({
        vertexColors: true,
        map: this.atlasTexture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
      const meshT = new THREE.Mesh(transparent, matT)
      meshT.frustumCulled = true
      this.scene.add(meshT)
      this.transparentMeshes.set(key, meshT)
    }
  }

  /** 设置当前选中的方块位置（用于绘制外框） */
  setSelected(x: number | null, y: number | null, z: number | null) {
    if (x === null || y === null || z === null) {
      this.selectionBox.visible = false
      this.breakOverlay.visible = false
      return
    }
    this.selectionBox.position.set(x + 0.5, y + 0.5, z + 0.5)
    this.selectionBox.visible = true
    this.breakOverlay.position.set(x + 0.5, y + 0.5, z + 0.5)
  }

  setBreakProgress(p: number) {
    if (p <= 0) {
      this.breakOverlay.visible = false
      return
    }
    this.breakOverlay.visible = true
    const m = this.breakOverlay.material as THREE.MeshBasicMaterial
    m.opacity = 0.15 + p * 0.55
    // 简单的方块塌缩效果：缩小
    const s = 1 - p * 0.2
    this.breakOverlay.scale.set(s, s, s)
  }

  tick() {
    const now = performance.now()
    const dt = (now - this.prevTime) / 1000
    this.prevTime = now
    this.frameTimes.push(dt)
    if (this.frameTimes.length > 60) this.frameTimes.shift()
    this.fps = 1 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length)

    this.worldTime = (this.worldTime + dt * 20) % 24000
    this.updateSky()
    this.renderer.render(this.scene, this.camera)
  }

  private updateSky() {
    const t = this.worldTime / 24000
    const sunAngle = (t - 0.25) * Math.PI * 2
    const height = Math.sin(sunAngle)
    const sunDir = new THREE.Vector3(Math.cos(sunAngle), height, 0.2).normalize()
    this.sun.position.copy(sunDir).multiplyScalar(50)
    this.sun.intensity = Math.max(0, height) * 1.0
    this.ambient.intensity = 0.3 + Math.max(0, height) * 0.4

    const day = new THREE.Color(0x87ceeb)
    const night = new THREE.Color(0x12122a)
    const dawn = new THREE.Color(0xf5a36e)
    let col: THREE.Color
    if (t < 0.25) col = night
    else if (t < 0.30) col = night.clone().lerp(dawn, (t - 0.25) / 0.05)
    else if (t < 0.50) col = day.clone().lerp(dawn, Math.max(0, (0.5 - t) / 0.2))
    else if (t < 0.75) col = day
    else if (t < 0.80) col = day.clone().lerp(dawn, (t - 0.75) / 0.05)
    else col = night.clone().lerp(dawn, Math.max(0, (1 - t) / 0.2))
    this.scene.background = col
    if (this.scene.fog) this.scene.fog.color = col
  }

  updateDirtyChunks() {
    const dirty = this.world.getDirtyChunks()
    for (const c of dirty) this.buildChunkMesh(c)
  }

  removeChunk(cx: number, cz: number) {
    const key = `${cx},${cz}`
    const m = this.meshes.get(key)
    if (m) { this.scene.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); this.meshes.delete(key) }
    const mt = this.transparentMeshes.get(key)
    if (mt) { this.scene.remove(mt); mt.geometry.dispose(); (mt.material as THREE.Material).dispose(); this.transparentMeshes.delete(key) }
  }
}
