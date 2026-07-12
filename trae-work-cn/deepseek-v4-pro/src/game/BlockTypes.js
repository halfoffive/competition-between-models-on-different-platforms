// 方块类型系统

export const BLOCK_TYPES = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
}

// 方块颜色定义
export const BLOCK_COLORS = {
  [BLOCK_TYPES.GRASS]: {
    top: 0x7ec850,
    side: 0x8b7355,
    bottom: 0x8b7355,
  },
  [BLOCK_TYPES.DIRT]: {
    top: 0x8b7355,
    side: 0x8b7355,
    bottom: 0x8b7355,
  },
  [BLOCK_TYPES.STONE]: {
    top: 0x808080,
    side: 0x808080,
    bottom: 0x808080,
  },
  [BLOCK_TYPES.WOOD]: {
    top: 0xbc9862,
    side: 0x8b6914,
    bottom: 0xbc9862,
  },
  [BLOCK_TYPES.LEAVES]: {
    top: 0x3a7734,
    side: 0x3a7734,
    bottom: 0x3a7734,
  },
  [BLOCK_TYPES.SAND]: {
    top: 0xded172,
    side: 0xded172,
    bottom: 0xded172,
  },
  [BLOCK_TYPES.WATER]: {
    top: 0x3366cc,
    side: 0x3366cc,
    bottom: 0x3366cc,
  },
}

// 面方向枚举
export const FACES = {
  TOP: 0,
  BOTTOM: 1,
  FRONT: 2,
  BACK: 3,
  LEFT: 4,
  RIGHT: 5,
}

/**
 * 获取方块指定面的颜色
 * @param {number} type - 方块类型
 * @param {number} face - 面方向 (FACES 枚举)
 * @returns {number} 颜色 hex 值
 */
export function getBlockColor(type, face) {
  if (type === BLOCK_TYPES.AIR) {
    return 0x000000
  }
  const colors = BLOCK_COLORS[type]
  if (!colors) {
    return 0xff00ff // 洋红色标记未知方块
  }
  switch (face) {
    case FACES.TOP:
      return colors.top
    case FACES.BOTTOM:
      return colors.bottom
    default:
      return colors.side
  }
}

/**
 * 获取方块类型名称
 * @param {number} type
 * @returns {string}
 */
export function getBlockName(type) {
  const names = {
    [BLOCK_TYPES.AIR]: '空气',
    [BLOCK_TYPES.GRASS]: '草方块',
    [BLOCK_TYPES.DIRT]: '泥土',
    [BLOCK_TYPES.STONE]: '石头',
    [BLOCK_TYPES.WOOD]: '木头',
    [BLOCK_TYPES.LEAVES]: '树叶',
    [BLOCK_TYPES.SAND]: '沙子',
    [BLOCK_TYPES.WATER]: '水',
  }
  return names[type] || '未知'
}