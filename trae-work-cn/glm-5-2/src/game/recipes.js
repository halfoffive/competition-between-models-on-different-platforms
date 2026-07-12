// 合成配方模块
// pattern 为 3x3 网格（null 表示空位，其余为方块 ID）
// 匹配时需先标准化：裁剪到最小非空矩形，消除位置偏移影响
import { BLOCK } from './blocks.js'

// 合成配方列表
export const RECIPES = [
  // 1 原木 -> 4 木板
  {
    pattern: [
      [null, null, null],
      [null, BLOCK.LOG, null],
      [null, null, null]
    ],
    result: { id: BLOCK.PLANKS, count: 4 }
  },
  // 2 4 木板 -> 工作台
  {
    pattern: [
      [BLOCK.PLANKS, BLOCK.PLANKS, null],
      [BLOCK.PLANKS, BLOCK.PLANKS, null],
      [null, null, null]
    ],
    result: { id: BLOCK.CRAFTING_TABLE, count: 1 }
  },
  // 3 8 圆石 -> 熔炉
  {
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE, null, BLOCK.COBBLESTONE],
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, BLOCK.COBBLESTONE]
    ],
    result: { id: BLOCK.FURNACE, count: 1 }
  },
  // 4 4 圆石 -> 石头
  {
    pattern: [
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, null],
      [BLOCK.COBBLESTONE, BLOCK.COBBLESTONE, null],
      [null, null, null]
    ],
    result: { id: BLOCK.STONE, count: 1 }
  }
]

// 将 3x3 网格裁剪到最小非空矩形
// 返回 { grid: 二维数组, w, h }，或空网格（若全为 null）
function normalize(grid) {
  let minR = 3, minC = 3, maxR = -1, maxC = -1
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] !== null && grid[r][c] !== undefined) {
        if (r < minR) minR = r
        if (c < minC) minC = c
        if (r > maxR) maxR = r
        if (c > maxC) maxC = c
      }
    }
  }
  // 全空
  if (maxR < 0) return { grid: [], w: 0, h: 0 }
  const w = maxC - minC + 1
  const h = maxR - minR + 1
  const out = []
  for (let r = 0; r < h; r++) {
    const row = []
    for (let c = 0; c < w; c++) {
      row.push(grid[minR + r][minC + c] ?? null)
    }
    out.push(row)
  }
  return { grid: out, w, h }
}

// 比较两个已标准化网格是否完全相同
function sameGrid(a, b) {
  if (a.length !== b.length) return false
  for (let r = 0; r < a.length; r++) {
    if (a[r].length !== b[r].length) return false
    for (let c = 0; c < a[r].length; c++) {
      const av = a[r][c] ?? null
      const bv = b[r][c] ?? null
      if (av !== bv) return false
    }
  }
  return true
}

// 匹配合成网格：返回匹配配方的 result，或 null
// grid 为 3x3 数组（元素为 blockId 或 null）
export function matchRecipe(grid) {
  const target = normalize(grid)
  if (target.grid.length === 0) return null
  for (const recipe of RECIPES) {
    const norm = normalize(recipe.pattern)
    if (norm.w !== target.w || norm.h !== target.h) continue
    if (sameGrid(norm.grid, target.grid)) {
      return recipe.result
    }
  }
  return null
}
