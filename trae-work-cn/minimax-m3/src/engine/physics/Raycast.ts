import * as THREE from 'three'
import { World } from '../world/World'
import { BlockId, isBlockIdSolid, isBlockIdFluid } from '../world/BlockId'
import { CHUNK_SIZE } from '../world/Chunk'

export interface RaycastHit {
  block: BlockId
  x: number
  y: number
  z: number
  /** 命中面法线（指向放置位置） */
  normal: [number, number, number]
  /** 命中距离 */
  distance: number
}

export interface RaycastOptions {
  maxDistance?: number
  /** 是否包含流体作为阻挡（默认 false） */
  hitFluids?: boolean
}

const DDA_STEP = 0.05

/**
 * DDA 体素射线检测。
 * - origin: 起点
 * - direction: 单位向量
 */
export function raycastVoxels(
  world: World,
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  options: RaycastOptions = {}
): RaycastHit | null {
  const maxDist = options.maxDistance ?? 6
  const hitFluids = options.hitFluids ?? false

  let pos = origin.clone()
  const step = direction.clone().multiplyScalar(DDA_STEP)
  for (let t = 0; t < maxDist / DDA_STEP; t++) {
    pos.add(step)
    const bx = Math.floor(pos.x)
    const by = Math.floor(pos.y)
    const bz = Math.floor(pos.z)
    const block = world.getBlock(bx, by, bz)
    if (block === BlockId.AIR) continue
    const isSolid = isBlockIdSolid(block) || (hitFluids && isBlockIdFluid(block))
    if (!isSolid) continue
    // 计算面法线
    const normal = computeNormal(world, bx, by, bz, hitFluids)
    return {
      block,
      x: bx,
      y: by,
      z: bz,
      normal,
      distance: t * DDA_STEP,
    }
  }
  return null
}

function computeNormal(world: World, bx: number, by: number, bz: number, hitFluids: boolean): [number, number, number] {
  // 简化：检查六个面，找出与空气/透明相邻的面
  const offsets: [number, number, number][] = [
    [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
  ]
  for (const [dx, dy, dz] of offsets) {
    const nb = world.getBlock(bx + dx, by + dy, bz + dz)
    if (nb === BlockId.AIR) {
      // 找到第一个邻接空气的面
      return [dx, dy, dz] as [number, number, number]
    }
  }
  return [0, 1, 0]
}
