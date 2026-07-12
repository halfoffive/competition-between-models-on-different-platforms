import { BlockId } from '../world/BlockId'

export type Recipe = {
  /** 网格大小，默认 3（自动从 pattern 长度推导） */
  size?: 2 | 3
  /** 行优先索引，null = 空 */
  pattern: (BlockId | null)[]
  result: { id: BlockId; count: number }
}

export const recipes: Recipe[] = [
  // 木板（原木 -> 4 板）
  { pattern: [BlockId.OAK_LOG, null, null, null, null, null, null, null, null], result: { id: BlockId.OAK_PLANKS, count: 4 } },
  { pattern: [BlockId.SPRUCE_LOG, null, null, null, null, null, null, null, null], result: { id: BlockId.OAK_PLANKS, count: 4 } },

  // 木棍（2 板 -> 4 棍，2x2）
  { size: 2, pattern: [BlockId.OAK_PLANKS, null, BlockId.OAK_PLANKS, null], result: { id: BlockId.STICK, count: 4 } },

  // 工作台
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, null, null, null], result: { id: BlockId.CRAFTING_TABLE, count: 1 } },

  // 熔炉
  { pattern: [BlockId.COBBLESTONE, BlockId.COBBLESTONE, null, BlockId.COBBLESTONE, BlockId.COBBLESTONE, null, null, null, null], result: { id: BlockId.FURNACE, count: 1 } },

  // 木镐
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, BlockId.STICK, null, null, BlockId.STICK, null], result: { id: BlockId.WOODEN_PICKAXE, count: 1 } },
  // 石镐
  { pattern: [BlockId.COBBLESTONE, BlockId.COBBLESTONE, BlockId.COBBLESTONE, null, BlockId.STICK, null, null, BlockId.STICK, null], result: { id: BlockId.STONE_PICKAXE, count: 1 } },
  // 铁镐
  { pattern: [BlockId.IRON_INGOT, BlockId.IRON_INGOT, BlockId.IRON_INGOT, null, BlockId.STICK, null, null, BlockId.STICK, null], result: { id: BlockId.IRON_PICKAXE, count: 1 } },
  // 钻石镐
  { pattern: [BlockId.DIAMOND, BlockId.DIAMOND, BlockId.DIAMOND, null, BlockId.STICK, null, null, BlockId.STICK, null], result: { id: BlockId.DIAMOND_PICKAXE, count: 1 } },

  // 木锹
  { size: 2, pattern: [BlockId.OAK_PLANKS, null, BlockId.STICK, null], result: { id: BlockId.WOODEN_SHOVEL, count: 1 } },
  // 石锹
  { size: 2, pattern: [BlockId.COBBLESTONE, null, BlockId.STICK, null], result: { id: BlockId.STONE_PICKAXE, count: 1 } },
  // 铁锹 -> 用石锹占位

  // 木斧
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, BlockId.OAK_PLANKS, BlockId.STICK, null, null, BlockId.STICK, null], result: { id: BlockId.WOODEN_AXE, count: 1 } },

  // 木剑
  { pattern: [BlockId.OAK_PLANKS, null, null, BlockId.OAK_PLANKS, null, null, BlockId.STICK, null, null], result: { id: BlockId.WOODEN_SWORD, count: 1 } },
  // 石剑
  { pattern: [BlockId.COBBLESTONE, null, null, BlockId.COBBLESTONE, null, null, BlockId.STICK, null, null], result: { id: BlockId.STONE_SWORD, count: 1 } },
  // 铁剑
  { pattern: [BlockId.IRON_INGOT, null, null, BlockId.IRON_INGOT, null, null, BlockId.STICK, null, null], result: { id: BlockId.IRON_SWORD, count: 1 } },
  // 钻石剑
  { pattern: [BlockId.DIAMOND, null, null, BlockId.DIAMOND, null, null, BlockId.STICK, null, null], result: { id: BlockId.DIAMOND_SWORD, count: 1 } },

  // 木锄
  { pattern: [BlockId.OAK_PLANKS, BlockId.STICK, null, null, BlockId.STICK, null, null, null, null], result: { id: BlockId.WOODEN_HOE, count: 1 } },

  // 面包
  { pattern: [BlockId.WHEAT, BlockId.WHEAT, BlockId.WHEAT, null, null, null, null, null, null], result: { id: BlockId.BREAD, count: 1 } },

  // 玻璃（沙子）
  { pattern: [BlockId.SAND, null, null, BlockId.SAND, null, null, null, null, null], result: { id: BlockId.GLASS, count: 1 } },

  // 火把
  { size: 2, pattern: [BlockId.COAL, null, BlockId.STICK, null], result: { id: BlockId.TORCH, count: 4 } },
  { size: 2, pattern: [BlockId.COAL, null, null, BlockId.STICK], result: { id: BlockId.TORCH, count: 4 } },

  // 草径
  { size: 2, pattern: [BlockId.DIRT, null, null, null], result: { id: BlockId.GRASS_PATH, count: 1 } },

  // 书架
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.BOOK, BlockId.BOOK, BlockId.BOOK, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS], result: { id: BlockId.BOOKSHELF, count: 1 } },
  // 萤石
  { pattern: [BlockId.GLOWSTONE_DUST, null, null, null, null, null, null, null, null], result: { id: BlockId.GLOWSTONE, count: 1 } },
  // TNT 占位
  { pattern: [BlockId.SAND, null, BlockId.SAND, null, BlockId.SAND, null, BlockId.SAND, null, BlockId.SAND], result: { id: BlockId.TNT, count: 1 } },
  // 床
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, null, null, null, null, null], result: { id: BlockId.BED, count: 1 } },
  // 箱子
  { pattern: [BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, null, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS, BlockId.OAK_PLANKS], result: { id: BlockId.CHEST, count: 1 } },
]

/** 熔炉配方：输入 -> 输出 + 烧制时间（tick） */
export type FurnaceRecipe = { input: BlockId; output: BlockId; time: number; experience: number }

export const furnaceRecipes: FurnaceRecipe[] = [
  { input: BlockId.IRON_ORE, output: BlockId.IRON_INGOT, time: 200, experience: 0.7 },
  { input: BlockId.GOLD_ORE, output: BlockId.GOLD_INGOT, time: 200, experience: 1.0 },
  { input: BlockId.SAND, output: BlockId.GLASS, time: 200, experience: 0 },
  { input: BlockId.COBBLESTONE, output: BlockId.STONE, time: 200, experience: 0 },
]

export const fuelItems: BlockId[] = [
  BlockId.COAL, BlockId.OAK_PLANKS, BlockId.OAK_LOG, BlockId.STICK, BlockId.BREAD
]

/** 燃料燃烧时间（tick） */
export function fuelTicks(fuel: BlockId): number {
  switch (fuel) {
    case BlockId.COAL: return 160
    case BlockId.OAK_LOG: return 300
    case BlockId.OAK_PLANKS: return 300
    case BlockId.STICK: return 100
    default: return 0
  }
}

/** 工具/武器的攻击伤害 */
export function attackDamage(item: BlockId | null): number {
  if (item === null || item === undefined) return 1
  switch (item) {
    case BlockId.WOODEN_SWORD: return 5
    case BlockId.STONE_SWORD: return 6
    case BlockId.IRON_SWORD: return 7
    case BlockId.DIAMOND_SWORD: return 8
    default: return 1
  }
}

/** 工具的采集等级 */
export function toolTier(item: BlockId | null): number {
  if (item === null || item === undefined) return 0
  switch (item) {
    case BlockId.WOODEN_PICKAXE:
    case BlockId.WOODEN_SWORD:
    case BlockId.WOODEN_AXE:
    case BlockId.WOODEN_SHOVEL:
    case BlockId.WOODEN_HOE: return 1
    case BlockId.STONE_PICKAXE:
    case BlockId.STONE_SWORD: return 2
    case BlockId.IRON_PICKAXE:
    case BlockId.IRON_SWORD: return 3
    case BlockId.DIAMOND_PICKAXE:
    case BlockId.DIAMOND_SWORD: return 4
    default: return 0
  }
}

/** 是否是镐类 */
export function isPickaxe(item: BlockId | null): boolean {
  if (item === null || item === undefined) return false
  return item === BlockId.WOODEN_PICKAXE || item === BlockId.STONE_PICKAXE || item === BlockId.IRON_PICKAXE || item === BlockId.DIAMOND_PICKAXE
}

export const woodTypes: BlockId[] = [BlockId.OAK_LOG, BlockId.SPRUCE_LOG]
export const plankTypes: BlockId[] = [BlockId.OAK_PLANKS]

/** 在网格中查找匹配配方。grid 长度 9 (3x3) 或 4 (2x2)。 */
export function findRecipe(grid: (BlockId | null)[]): Recipe | null {
  const size = Math.sqrt(grid.length)
  if (size !== 2 && size !== 3) return null
  const trimmed = trimGrid(grid, size)
  if (trimmed.length === 0) return null
  const ts = Math.sqrt(trimmed.length)
  for (const r of recipes) {
    if (r.size && r.size !== ts) continue
    if (matchPattern(trimmed, r.pattern)) return r
  }
  return null
}

function trimGrid(grid: (BlockId | null)[], size: number): (BlockId | null)[] {
  let minRow = size, maxRow = -1, minCol = size, maxCol = -1
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r * size + c] !== null) {
        if (r < minRow) minRow = r
        if (r > maxRow) maxRow = r
        if (c < minCol) minCol = c
        if (c > maxCol) maxCol = c
      }
    }
  }
  if (maxRow === -1) return []
  const h = maxRow - minRow + 1
  const w = maxCol - minCol + 1
  if (h > 3 || w > 3) return []
  const out: (BlockId | null)[] = new Array(h * w).fill(null)
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      out[r * w + c] = grid[(minRow + r) * size + (minCol + c)]
    }
  }
  return out
}

function matchPattern(grid: (BlockId | null)[], pattern: (BlockId | null)[]): boolean {
  if (grid.length !== pattern.length) return false
  for (let i = 0; i < grid.length; i++) {
    const g = grid[i]
    const p = pattern[i]
    if (g === p) continue
    if (g === null || p === null) return false
    if (woodTypes.includes(g) && woodTypes.includes(p)) continue
    if (plankTypes.includes(g) && plankTypes.includes(p)) continue
    return false
  }
  return true
}
