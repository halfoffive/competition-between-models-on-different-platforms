// 方块定义模块
// 定义所有方块的 ID 常量、属性表，以及海平面等常量

// 方块 ID 枚举
export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  LOG: 5,
  LEAVES: 6,
  WATER: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  PLANKS: 10,
  COBBLESTONE: 11,
  GLASS: 12,
  BEDROCK: 13,
  CACTUS: 14,
  CRAFTING_TABLE: 15,
  FURNACE: 16
}

// 海平面高度
export const SEA_LEVEL = 63

// 方块属性表：索引为方块 ID
// 每项 { id, name, solid, transparent, liquid, tiles }
// - solid: 是否实体（参与碰撞）
// - transparent: 是否透明（影响面剔除；水/玻璃为 true，树叶按 opaque 处理 false）
// - liquid: 是否液体
// - tiles: 纹理图集 tile 索引 { top, bottom, side }
export const BLOCKS = [
  // 0 AIR
  {
    id: BLOCK.AIR,
    name: 'air',
    solid: false,
    transparent: true,
    liquid: false,
    tiles: { top: 0, bottom: 0, side: 0 }
  },
  // 1 GRASS
  {
    id: BLOCK.GRASS,
    name: 'grass',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 0, bottom: 2, side: 1 }
  },
  // 2 DIRT
  {
    id: BLOCK.DIRT,
    name: 'dirt',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 2, bottom: 2, side: 2 }
  },
  // 3 STONE
  {
    id: BLOCK.STONE,
    name: 'stone',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 3, bottom: 3, side: 3 }
  },
  // 4 SAND
  {
    id: BLOCK.SAND,
    name: 'sand',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 4, bottom: 4, side: 4 }
  },
  // 5 LOG
  {
    id: BLOCK.LOG,
    name: 'log',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 5, bottom: 5, side: 6 }
  },
  // 6 LEAVES（transparent=false，按 opaque 处理）
  {
    id: BLOCK.LEAVES,
    name: 'leaves',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 7, bottom: 7, side: 7 }
  },
  // 7 WATER
  {
    id: BLOCK.WATER,
    name: 'water',
    solid: false,
    transparent: true,
    liquid: true,
    tiles: { top: 8, bottom: 8, side: 8 }
  },
  // 8 COAL_ORE
  {
    id: BLOCK.COAL_ORE,
    name: 'coal_ore',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 9, bottom: 9, side: 9 }
  },
  // 9 IRON_ORE
  {
    id: BLOCK.IRON_ORE,
    name: 'iron_ore',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 10, bottom: 10, side: 10 }
  },
  // 10 PLANKS
  {
    id: BLOCK.PLANKS,
    name: 'planks',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 11, bottom: 11, side: 11 }
  },
  // 11 COBBLESTONE
  {
    id: BLOCK.COBBLESTONE,
    name: 'cobblestone',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 12, bottom: 12, side: 12 }
  },
  // 12 GLASS
  {
    id: BLOCK.GLASS,
    name: 'glass',
    solid: true,
    transparent: true,
    liquid: false,
    tiles: { top: 13, bottom: 13, side: 13 }
  },
  // 13 BEDROCK
  {
    id: BLOCK.BEDROCK,
    name: 'bedrock',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 14, bottom: 14, side: 14 }
  },
  // 14 CACTUS
  {
    id: BLOCK.CACTUS,
    name: 'cactus',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 15, bottom: 15, side: 15 }
  },
  // 15 CRAFTING_TABLE
  {
    id: BLOCK.CRAFTING_TABLE,
    name: 'crafting_table',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 16, bottom: 2, side: 17 }
  },
  // 16 FURNACE
  {
    id: BLOCK.FURNACE,
    name: 'furnace',
    solid: true,
    transparent: false,
    liquid: false,
    tiles: { top: 18, bottom: 3, side: 18 }
  }
]

// 判断方块是否透明
export function isTransparent(id) {
  if (id < 0 || id >= BLOCKS.length) return true
  return BLOCKS[id].transparent
}

// 判断方块是否实体
export function isSolid(id) {
  if (id < 0 || id >= BLOCKS.length) return false
  return BLOCKS[id].solid
}

// 快捷栏方块映射：槽位 0-8 对应的方块 ID
export const HOTBAR = [
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.COBBLESTONE, BLOCK.PLANKS,
  BLOCK.LOG, BLOCK.LEAVES, BLOCK.SAND, BLOCK.GLASS
]
