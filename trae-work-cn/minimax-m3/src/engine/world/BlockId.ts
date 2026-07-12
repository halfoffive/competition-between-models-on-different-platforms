/**
 * 全部方块 ID。采用 8 位无符号整数表示，0 为空气。
 * 块属性（硬度、透明度、是否流体、是否固体、是否发光）由 BlockRegistry 维护。
 */
export enum BlockId {
  AIR = 0,
  // 天然
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  SAND = 5,
  GRAVEL = 6,
  BEDROCK = 7,
  SNOW_BLOCK = 8,
  CLAY = 9,
  // 木材
  OAK_LOG = 10,
  OAK_LEAVES = 11,
  OAK_PLANKS = 12,
  SPRUCE_LOG = 13,
  SPRUCE_LEAVES = 14,
  // 矿物
  COAL_ORE = 20,
  IRON_ORE = 21,
  GOLD_ORE = 22,
  DIAMOND_ORE = 23,
  REDSTONE_ORE = 24,
  // 流体
  WATER = 30,
  LAVA = 31,
  // 特殊
  GLASS = 40,
  TNT = 41,
  GRASS_PATH = 42,
  // 功能
  CRAFTING_TABLE = 50,
  FURNACE = 51,
  CHEST = 52,
  TORCH = 53,
  // 光源
  GLOWSTONE = 60,
  // 植物
  FLOWER_RED = 70,
  FLOWER_YELLOW = 71,
  TALL_GRASS = 72,
  CACTUS = 73,
  // 装饰
  BOOKSHELF = 80,
  COBBLESTONE_STAIRS = 81,
  // 床
  BED = 90,
  // 食物
  WHEAT = 100,
  // 熔炼产物
  IRON_INGOT = 110,
  GOLD_INGOT = 111,
  DIAMOND = 112,
  COAL = 113,
  // 工具
  WOODEN_PICKAXE = 200,
  WOODEN_SWORD = 201,
  WOODEN_SHOVEL = 202,
  WOODEN_AXE = 203,
  WOODEN_HOE = 204,
  STONE_PICKAXE = 210,
  STONE_SWORD = 211,
  IRON_PICKAXE = 220,
  IRON_SWORD = 221,
  DIAMOND_PICKAXE = 230,
  DIAMOND_SWORD = 231,
  STICK = 240,
  // 食物成品
  BREAD = 300,
  // 其他
  FLINT = 400,
  BOOK = 410,
  GLOWSTONE_DUST = 420,
  GUNPOWDER = 430,
}

export function isBlockIdSolid(id: BlockId): boolean {
  return id !== BlockId.AIR && id !== BlockId.WATER && id !== BlockId.LAVA && id !== BlockId.GLASS &&
         id !== BlockId.OAK_LEAVES && id !== BlockId.SPRUCE_LEAVES && id !== BlockId.TORCH &&
         id !== BlockId.FLOWER_RED && id !== BlockId.FLOWER_YELLOW && id !== BlockId.TALL_GRASS &&
         id !== BlockId.SNOW_BLOCK; // 雪块可放但可踩
}

export function isBlockIdTransparent(id: BlockId): boolean {
  return id === BlockId.AIR || id === BlockId.GLASS || id === BlockId.OAK_LEAVES ||
         id === BlockId.SPRUCE_LEAVES || id === BlockId.TORCH || id === BlockId.FLOWER_RED ||
         id === BlockId.FLOWER_YELLOW || id === BlockId.TALL_GRASS || id === BlockId.WATER;
}

export function isBlockIdFluid(id: BlockId): boolean {
  return id === BlockId.WATER || id === BlockId.LAVA;
}

export function isBlockIdLightSource(id: BlockId): boolean {
  return id === BlockId.TORCH || id === BlockId.GLOWSTONE || id === BlockId.LAVA;
}
