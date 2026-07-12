export enum BlockType {
  Air = 0,
  Grass,
  Dirt,
  Stone,
  Wood,
  Leaves,
  Water,
  Sand,
  Glass,
  Brick,
  DiamondOre,
}

export const PLACEABLE_BLOCK_TYPES: BlockType[] = [
  BlockType.Grass,
  BlockType.Dirt,
  BlockType.Stone,
  BlockType.Wood,
  BlockType.Leaves,
  BlockType.Sand,
  BlockType.Glass,
  BlockType.Brick,
  BlockType.DiamondOre,
]

export interface BlockDef {
  name: string
  solid: boolean
  transparent: boolean
  liquid: boolean
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  [BlockType.Air]: { name: 'Air', solid: false, transparent: true, liquid: false },
  [BlockType.Grass]: { name: 'Grass', solid: true, transparent: false, liquid: false },
  [BlockType.Dirt]: { name: 'Dirt', solid: true, transparent: false, liquid: false },
  [BlockType.Stone]: { name: 'Stone', solid: true, transparent: false, liquid: false },
  [BlockType.Wood]: { name: 'Wood', solid: true, transparent: false, liquid: false },
  [BlockType.Leaves]: { name: 'Leaves', solid: true, transparent: true, liquid: false },
  [BlockType.Water]: { name: 'Water', solid: false, transparent: true, liquid: true },
  [BlockType.Sand]: { name: 'Sand', solid: true, transparent: false, liquid: false },
  [BlockType.Glass]: { name: 'Glass', solid: true, transparent: true, liquid: false },
  [BlockType.Brick]: { name: 'Brick', solid: true, transparent: false, liquid: false },
  [BlockType.DiamondOre]: { name: 'Diamond Ore', solid: true, transparent: false, liquid: false },
}

export function isSolid(type: BlockType): boolean {
  return BLOCK_DEFS[type].solid
}

export function isTransparent(type: BlockType): boolean {
  return BLOCK_DEFS[type].transparent
}

export function isLiquid(type: BlockType): boolean {
  return BLOCK_DEFS[type].liquid
}
