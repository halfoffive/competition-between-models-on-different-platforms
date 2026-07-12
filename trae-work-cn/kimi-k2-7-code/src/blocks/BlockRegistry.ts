import { MeshStandardMaterial, Texture } from 'three'
import { BlockType } from './BlockType'
import {
  canvasToTexture,
  makeBlockTexture,
  makeGrassTopTexture,
  makeGrassSideTexture,
  makeWoodSideTexture,
  makeWoodTopTexture,
  makeLeavesTexture,
  makeWaterTexture,
  makeGlassTexture,
  makeBrickTexture,
  makeDiamondOreTexture,
} from './texture'

export type BlockMaterial = MeshStandardMaterial | MeshStandardMaterial[]

export class BlockRegistry {
  private materials = new Map<BlockType, BlockMaterial>()

  constructor() {
    this.initMaterials()
  }

  private initMaterials(): void {
    this.materials.set(
      BlockType.Grass,
      [
        new MeshStandardMaterial({ map: canvasToTexture(makeGrassSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeGrassSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeGrassTopTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeBlockTexture('#7a5a3a', '#8f6e4d', '#5c4a35')) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeGrassSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeGrassSideTexture()) }),
      ],
    )

    this.materials.set(
      BlockType.Dirt,
      new MeshStandardMaterial({
        map: canvasToTexture(makeBlockTexture('#7a5a3a', '#8f6e4d', '#5c4a35')),
      }),
    )

    this.materials.set(
      BlockType.Stone,
      new MeshStandardMaterial({
        map: canvasToTexture(makeBlockTexture('#808080', '#999999', '#5a5a5a')),
      }),
    )

    this.materials.set(
      BlockType.Wood,
      [
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodTopTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodTopTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodSideTexture()) }),
        new MeshStandardMaterial({ map: canvasToTexture(makeWoodSideTexture()) }),
      ],
    )

    this.materials.set(
      BlockType.Leaves,
      new MeshStandardMaterial({
        map: canvasToTexture(makeLeavesTexture()),
        transparent: true,
        alphaTest: 0.5,
      }),
    )

    this.materials.set(
      BlockType.Water,
      new MeshStandardMaterial({
        map: canvasToTexture(makeWaterTexture()),
        transparent: true,
        opacity: 0.7,
        roughness: 0.1,
        metalness: 0.1,
      }),
    )

    this.materials.set(
      BlockType.Sand,
      new MeshStandardMaterial({
        map: canvasToTexture(makeBlockTexture('#d6c684', '#e5dcb0', '#b5a86a')),
      }),
    )

    this.materials.set(
      BlockType.Glass,
      new MeshStandardMaterial({
        map: canvasToTexture(makeGlassTexture()),
        transparent: true,
        opacity: 0.5,
        roughness: 0.05,
        metalness: 0.1,
      }),
    )

    this.materials.set(
      BlockType.Brick,
      new MeshStandardMaterial({
        map: canvasToTexture(makeBrickTexture()),
      }),
    )

    this.materials.set(
      BlockType.DiamondOre,
      new MeshStandardMaterial({
        map: canvasToTexture(makeDiamondOreTexture()),
      }),
    )
  }

  getMaterial(type: BlockType): BlockMaterial | undefined {
    return this.materials.get(type)
  }

  getTexture(type: BlockType): Texture | undefined {
    const mat = this.materials.get(type)
    if (!mat) return undefined
    if (Array.isArray(mat)) {
      const first = mat[0]
      return first.map ?? undefined
    }
    return mat.map ?? undefined
  }

  dispose(): void {
    for (const mat of this.materials.values()) {
      if (Array.isArray(mat)) {
        mat.forEach((m) => this.disposeMaterial(m))
      } else {
        this.disposeMaterial(mat)
      }
    }
    this.materials.clear()
  }

  private disposeMaterial(mat: MeshStandardMaterial): void {
    if (mat.map) mat.map.dispose()
    mat.dispose()
  }
}

export const blockRegistry = new BlockRegistry()
