import {
  Scene,
  PerspectiveCamera,
  Vector3,
  LineSegments,
  BoxGeometry,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  Color,
} from 'three'
import { WorldRenderer } from '@/world/WorldRenderer'
import { BlockType, isSolid } from '@/blocks/BlockType'
import { selectedBlockType } from '@/stores/gameState'
import type { FirstPersonController } from './FirstPersonController'

const REACH = 5
const PARTICLE_COUNT = 10
const PARTICLE_LIFE = 0.5

interface RaycastHit {
  block: Vector3
  normal: Vector3
}

interface ActiveParticles {
  points: Points
  velocities: Float32Array
  positions: Float32Array
  life: number
}

export class BlockInteraction {
  private camera: PerspectiveCamera
  private worldRenderer: WorldRenderer
  private scene: Scene
  private controller: FirstPersonController
  private domElement: HTMLElement

  private highlightBox: LineSegments
  private particles: ActiveParticles[] = []
  private lastHit: RaycastHit | null = null

  private boundMouseDown: (e: MouseEvent) => void
  private boundContextMenu: (e: MouseEvent) => void
  private onModify: (() => void) | null

  constructor(
    camera: PerspectiveCamera,
    worldRenderer: WorldRenderer,
    scene: Scene,
    controller: FirstPersonController,
    domElement: HTMLElement,
    onModify?: () => void,
  ) {
    this.camera = camera
    this.worldRenderer = worldRenderer
    this.scene = scene
    this.controller = controller
    this.domElement = domElement
    this.onModify = onModify ?? null

    const geometry = new BoxGeometry(1.005, 1.005, 1.005)
    const edges = new EdgesGeometry(geometry)
    const material = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    this.highlightBox = new LineSegments(edges, material)
    this.highlightBox.visible = false
    this.scene.add(this.highlightBox)

    this.boundMouseDown = this.onMouseDown.bind(this)
    this.boundContextMenu = this.onContextMenu.bind(this)

    document.addEventListener('mousedown', this.boundMouseDown)
    this.domElement.addEventListener('contextmenu', this.boundContextMenu)
  }

  update(): void {
    this.raycast()
    this.updateHighlight()
    this.updateParticles()
  }

  private raycast(): void {
    const origin = this.camera.position.clone()
    const dir = this.getCameraDirection()
    this.lastHit = this.voxelRaycast(origin, dir, REACH)
  }

  private getCameraDirection(): Vector3 {
    const yaw = this.controller.getYaw()
    const pitch = this.controller.getPitch()
    return new Vector3(
      -Math.cos(pitch) * Math.sin(yaw),
      Math.sin(pitch),
      -Math.cos(pitch) * Math.cos(yaw),
    )
  }

  private voxelRaycast(origin: Vector3, dir: Vector3, maxDist: number): RaycastHit | null {
    if (dir.lengthSq() < 1e-12) return null
    dir.normalize()

    const cx = Math.floor(origin.x)
    const cy = Math.floor(origin.y)
    const cz = Math.floor(origin.z)

    const stepX = Math.sign(dir.x)
    const stepY = Math.sign(dir.y)
    const stepZ = Math.sign(dir.z)

    const tDeltaX = stepX === 0 ? Infinity : Math.abs(1 / dir.x)
    const tDeltaY = stepY === 0 ? Infinity : Math.abs(1 / dir.y)
    const tDeltaZ = stepZ === 0 ? Infinity : Math.abs(1 / dir.z)

    const tMaxX =
      stepX === 0
        ? Infinity
        : stepX > 0
          ? (Math.ceil(origin.x) - origin.x) / dir.x
          : (Math.floor(origin.x) - origin.x) / dir.x
    const tMaxY =
      stepY === 0
        ? Infinity
        : stepY > 0
          ? (Math.ceil(origin.y) - origin.y) / dir.y
          : (Math.floor(origin.y) - origin.y) / dir.y
    const tMaxZ =
      stepZ === 0
        ? Infinity
        : stepZ > 0
          ? (Math.ceil(origin.z) - origin.z) / dir.z
          : (Math.floor(origin.z) - origin.z) / dir.z

    let x = cx
    let y = cy
    let z = cz
    let tx = tMaxX
    let ty = tMaxY
    let tz = tMaxZ
    let traveled = 0
    const normal = new Vector3()

    while (traveled < maxDist) {
      if (tx < ty && tx < tz) {
        traveled = tx
        x += stepX
        tx += tDeltaX
        normal.set(-stepX, 0, 0)
      } else if (ty < tz) {
        traveled = ty
        y += stepY
        ty += tDeltaY
        normal.set(0, -stepY, 0)
      } else {
        traveled = tz
        z += stepZ
        tz += tDeltaZ
        normal.set(0, 0, -stepZ)
      }

      const type = this.worldRenderer.getWorld().getBlock(x, y, z)
      if (type !== BlockType.Air && isSolid(type)) {
        return { block: new Vector3(x, y, z), normal: normal.clone() }
      }
    }

    return null
  }

  private updateHighlight(): void {
    if (this.lastHit) {
      this.highlightBox.position.copy(this.lastHit.block).add(new Vector3(0.5, 0.5, 0.5))
      this.highlightBox.visible = true
    } else {
      this.highlightBox.visible = false
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (document.pointerLockElement !== this.domElement) return
    if (!this.lastHit) return

    if (e.button === 0) {
      this.breakBlock(this.lastHit.block)
    } else if (e.button === 2) {
      this.placeBlock(this.lastHit.block, this.lastHit.normal)
    }
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault()
  }

  private breakBlock(pos: Vector3): void {
    const type = this.worldRenderer.getWorld().getBlock(pos.x, pos.y, pos.z)
    if (type === BlockType.Air) return
    this.spawnParticles(pos, type)
    this.worldRenderer.removeBlock(pos.x, pos.y, pos.z)
    this.onModify?.()
  }

  private placeBlock(pos: Vector3, normal: Vector3): void {
    const target = pos.clone().add(normal)
    const x = Math.round(target.x)
    const y = Math.round(target.y)
    const z = Math.round(target.z)

    const existing = this.worldRenderer.getWorld().getBlock(x, y, z)
    if (existing !== BlockType.Air && isSolid(existing)) return

    if (this.intersectsPlayer(x, y, z)) return

    const type = selectedBlockType.value
    this.worldRenderer.setBlock(x, y, z, type)
    this.onModify?.()
  }

  private intersectsPlayer(bx: number, by: number, bz: number): boolean {
    const playerPos = this.controller.getPosition()
    const pMin = new Vector3(playerPos.x - 0.3, playerPos.y - 0.9, playerPos.z - 0.3)
    const pMax = new Vector3(playerPos.x + 0.3, playerPos.y + 0.9, playerPos.z + 0.3)
    const bMin = new Vector3(bx, by, bz)
    const bMax = new Vector3(bx + 1, by + 1, bz + 1)

    return (
      pMin.x < bMax.x &&
      pMax.x > bMin.x &&
      pMin.y < bMax.y &&
      pMax.y > bMin.y &&
      pMin.z < bMax.z &&
      pMax.z > bMin.z
    )
  }

  private spawnParticles(pos: Vector3, _type: BlockType): void {
    const color = new Color(0xffffff)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    const geometry = new BufferGeometry()

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = pos.x + 0.5 + (Math.random() - 0.5) * 0.6
      positions[i * 3 + 1] = pos.y + 0.5 + (Math.random() - 0.5) * 0.6
      positions[i * 3 + 2] = pos.z + 0.5 + (Math.random() - 0.5) * 0.6

      velocities[i * 3] = (Math.random() - 0.5) * 3
      velocities[i * 3 + 1] = Math.random() * 3
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 3
    }

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))

    const material = new PointsMaterial({
      color,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
    })

    const points = new Points(geometry, material)
    this.scene.add(points)
    this.particles.push({ points, velocities, positions, life: PARTICLE_LIFE })
  }

  private updateParticles(): void {
    const dt = 1 / 60
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= dt

      if (p.life <= 0) {
        this.scene.remove(p.points)
        p.points.geometry.dispose()
        ;(p.points.material as PointsMaterial).dispose()
        this.particles.splice(i, 1)
        continue
      }

      const positions = p.points.geometry.attributes.position.array as Float32Array
      for (let j = 0; j < PARTICLE_COUNT; j++) {
        p.velocities[j * 3 + 1] -= 9.8 * dt
        positions[j * 3] += p.velocities[j * 3] * dt
        positions[j * 3 + 1] += p.velocities[j * 3 + 1] * dt
        positions[j * 3 + 2] += p.velocities[j * 3 + 2] * dt
      }
      p.points.geometry.attributes.position.needsUpdate = true
      ;(p.points.material as PointsMaterial).opacity = p.life / PARTICLE_LIFE
    }
  }

  dispose(): void {
    document.removeEventListener('mousedown', this.boundMouseDown)
    this.domElement.removeEventListener('contextmenu', this.boundContextMenu)
    this.scene.remove(this.highlightBox)
    this.highlightBox.geometry.dispose()
    ;(this.highlightBox.material as LineBasicMaterial).dispose()

    for (const p of this.particles) {
      this.scene.remove(p.points)
      p.points.geometry.dispose()
      ;(p.points.material as PointsMaterial).dispose()
    }
    this.particles = []
  }
}

// Helper to avoid extra import from three/examples
class EdgesGeometry extends BufferGeometry {
  constructor(geometry: BoxGeometry) {
    super()
    const position = geometry.attributes.position.array as Float32Array
    const indices = geometry.index?.array as Uint16Array | undefined
    const edgeSet = new Set<string>()
    const edgeIndices: number[] = []

    const addEdge = (a: number, b: number) => {
      const key = a < b ? `${a},${b}` : `${b},${a}`
      if (edgeSet.has(key)) return
      edgeSet.add(key)
      edgeIndices.push(a, b)
    }

    if (indices) {
      for (let i = 0; i < indices.length; i += 3) {
        addEdge(indices[i], indices[i + 1])
        addEdge(indices[i + 1], indices[i + 2])
        addEdge(indices[i + 2], indices[i])
      }
    } else {
      for (let i = 0; i < position.length / 3; i += 3) {
        addEdge(i, i + 1)
        addEdge(i + 1, i + 2)
        addEdge(i + 2, i)
      }
    }

    const vertices = new Float32Array(edgeIndices.length * 3)
    for (let i = 0; i < edgeIndices.length; i++) {
      const idx = edgeIndices[i]
      vertices[i * 3] = position[idx * 3]
      vertices[i * 3 + 1] = position[idx * 3 + 1]
      vertices[i * 3 + 2] = position[idx * 3 + 2]
    }

    this.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  }
}
