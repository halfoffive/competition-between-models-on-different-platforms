import {
  Scene,
  InstancedMesh,
  PlaneGeometry,
  Vector3,
  Euler,
  MeshStandardMaterial,
  Object3D,
} from 'three'
import { World } from './World'
import { BlockType, isSolid, isTransparent, isLiquid } from '@/blocks/BlockType'
import { blockRegistry } from '@/blocks/BlockRegistry'
import { CHUNK_SIZE, CHUNK_HEIGHT, chunkKey, worldToChunk } from './Chunk'

const FACE_DIRECTIONS = [
  { dx: 1, dy: 0, dz: 0 },
  { dx: -1, dy: 0, dz: 0 },
  { dx: 0, dy: 1, dz: 0 },
  { dx: 0, dy: -1, dz: 0 },
  { dx: 0, dy: 0, dz: 1 },
  { dx: 0, dy: 0, dz: -1 },
]

const FACE_ROTATIONS: Euler[] = [
  new Euler(0, Math.PI / 2, 0),
  new Euler(0, -Math.PI / 2, 0),
  new Euler(-Math.PI / 2, 0, 0),
  new Euler(Math.PI / 2, 0, 0),
  new Euler(0, 0, 0),
  new Euler(0, Math.PI, 0),
]

const tmpObject = new Object3D()
const planeGeometry = new PlaneGeometry(1, 1)

function getFaceMaterial(type: BlockType, faceIndex: number): MeshStandardMaterial | undefined {
  const mat = blockRegistry.getMaterial(type)
  if (!mat) return undefined
  if (Array.isArray(mat)) {
    return mat[faceIndex]
  }
  return mat
}

function shouldRenderFace(type: BlockType, neighbor: BlockType): boolean {
  if (type === BlockType.Air || (!isSolid(type) && !isLiquid(type))) return false
  if (neighbor === BlockType.Air) return true
  if (neighbor === type) return false
  if (isTransparent(neighbor)) return true
  return false
}

interface FaceInstance {
  material: MeshStandardMaterial
  position: Vector3
  rotation: Euler
}

export class WorldRenderer {
  private scene: Scene
  private world: World
  private chunkMeshes = new Map<string, Map<MeshStandardMaterial, InstancedMesh>>()
  private renderDistance = 8

  constructor(scene: Scene, world: World) {
    this.scene = scene
    this.world = world
  }

  getWorld(): World {
    return this.world
  }

  setRenderDistance(distance: number): void {
    this.renderDistance = distance
  }

  update(centerX: number, centerZ: number): void {
    const centerChunk = worldToChunk(centerX, centerZ)
    const needed = new Set<string>()

    for (let dx = -this.renderDistance; dx <= this.renderDistance; dx++) {
      for (let dz = -this.renderDistance; dz <= this.renderDistance; dz++) {
        const cx = centerChunk.x + dx
        const cz = centerChunk.z + dz
        const key = chunkKey(cx, cz)
        needed.add(key)
        this.world.generateChunk(cx, cz)
        if (!this.chunkMeshes.has(key)) {
          this.buildChunkMesh(cx, cz)
        }
      }
    }

    for (const key of this.chunkMeshes.keys()) {
      if (!needed.has(key)) {
        const [cx, cz] = key.split(',').map(Number)
        this.unloadChunk(cx, cz)
      }
    }
  }

  buildChunkMesh(cx: number, cz: number): void {
    this.disposeChunkMesh(cx, cz)

    const baseX = cx * CHUNK_SIZE
    const baseZ = cz * CHUNK_SIZE
    const facesByMaterial = new Map<MeshStandardMaterial, FaceInstance[]>()

    for (let x = baseX; x < baseX + CHUNK_SIZE; x++) {
      for (let z = baseZ; z < baseZ + CHUNK_SIZE; z++) {
        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const type = this.world.getBlock(x, y, z)
          if (type === BlockType.Air || (!isSolid(type) && !isLiquid(type))) continue

          for (let f = 0; f < 6; f++) {
            const dir = FACE_DIRECTIONS[f]
            const nx = x + dir.dx
            const ny = y + dir.dy
            const nz = z + dir.dz
            const neighbor = this.world.getBlock(nx, ny, nz)
            if (!shouldRenderFace(type, neighbor)) continue

            const material = getFaceMaterial(type, f)
            if (!material) continue

            const position = new Vector3(
              x + dir.dx * 0.5,
              y + dir.dy * 0.5,
              z + dir.dz * 0.5,
            )
            const instances = facesByMaterial.get(material) ?? []
            instances.push({ material, position, rotation: FACE_ROTATIONS[f] })
            facesByMaterial.set(material, instances)
          }
        }
      }
    }

    const meshes = new Map<MeshStandardMaterial, InstancedMesh>()
    for (const [material, faces] of facesByMaterial) {
      const mesh = new InstancedMesh(planeGeometry, material, faces.length)
      mesh.castShadow = !material.transparent
      mesh.receiveShadow = true

      for (let i = 0; i < faces.length; i++) {
        const face = faces[i]
        tmpObject.position.copy(face.position)
        tmpObject.rotation.copy(face.rotation)
        tmpObject.scale.set(1, 1, 1)
        tmpObject.updateMatrix()
        mesh.setMatrixAt(i, tmpObject.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      this.scene.add(mesh)
      meshes.set(material, mesh)
    }

    this.chunkMeshes.set(chunkKey(cx, cz), meshes)
  }

  markChunkDirty(cx: number, cz: number): void {
    this.buildChunkMesh(cx, cz)
  }

  setBlock(x: number, y: number, z: number, type: BlockType): void {
    const oldType = this.world.getBlock(x, y, z)
    if (oldType === type) return
    this.world.setBlockModified(x, y, z, type)

    const chunk = worldToChunk(x, z)
    this.buildChunkMesh(chunk.x, chunk.z)

    const lx = x - chunk.x * CHUNK_SIZE
    const lz = z - chunk.z * CHUNK_SIZE
    if (lx === 0) this.buildChunkMesh(chunk.x - 1, chunk.z)
    if (lx === CHUNK_SIZE - 1) this.buildChunkMesh(chunk.x + 1, chunk.z)
    if (lz === 0) this.buildChunkMesh(chunk.x, chunk.z - 1)
    if (lz === CHUNK_SIZE - 1) this.buildChunkMesh(chunk.x, chunk.z + 1)
  }

  removeBlock(x: number, y: number, z: number): void {
    const oldType = this.world.getBlock(x, y, z)
    if (oldType === BlockType.Air) return
    this.world.removeBlockModified(x, y, z)

    const chunk = worldToChunk(x, z)
    this.buildChunkMesh(chunk.x, chunk.z)

    const lx = x - chunk.x * CHUNK_SIZE
    const lz = z - chunk.z * CHUNK_SIZE
    if (lx === 0) this.buildChunkMesh(chunk.x - 1, chunk.z)
    if (lx === CHUNK_SIZE - 1) this.buildChunkMesh(chunk.x + 1, chunk.z)
    if (lz === 0) this.buildChunkMesh(chunk.x, chunk.z - 1)
    if (lz === CHUNK_SIZE - 1) this.buildChunkMesh(chunk.x, chunk.z + 1)
  }

  unloadChunk(cx: number, cz: number): void {
    this.disposeChunkMesh(cx, cz)
  }

  private disposeChunkMesh(cx: number, cz: number): void {
    const key = chunkKey(cx, cz)
    const meshes = this.chunkMeshes.get(key)
    if (!meshes) return
    for (const mesh of meshes.values()) {
      this.scene.remove(mesh)
      mesh.dispose()
    }
    this.chunkMeshes.delete(key)
  }

  dispose(): void {
    for (const key of Array.from(this.chunkMeshes.keys())) {
      const [cx, cz] = key.split(',').map(Number)
      this.disposeChunkMesh(cx, cz)
    }
  }
}
