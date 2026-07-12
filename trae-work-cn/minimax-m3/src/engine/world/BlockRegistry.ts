import { BlockId, isBlockIdFluid, isBlockIdLightSource, isBlockIdSolid, isBlockIdTransparent } from './BlockId'

export interface BlockProperties {
  /** 显示名 */
  name: string
  /** 硬度（破坏时间倍率） */
  hardness: number
  /** 是否可堆叠物品 */
  stackable: boolean
  /** 单堆上限 */
  maxStack: number
  /** 挖掘需要的最低工具等级：0=手/任意, 1=木, 2=石, 3=铁, 4=钻石 */
  minToolTier: number
  /** 是否 "可拾起为物品"（几乎所有方块都 true，基岩为 false） */
  drops: boolean
  /** 发光等级 0-15 */
  light: number
}

/**
 * 方块属性查询表。运行时通过 ID 索引。
 */
export class BlockRegistry {
  private props: Map<BlockId, BlockProperties> = new Map()

  constructor() {
    this.registerDefaults()
  }

  private set(id: BlockId, p: Partial<BlockProperties>) {
    const def: BlockProperties = {
      name: p.name ?? 'Unknown',
      hardness: p.hardness ?? 1,
      stackable: p.stackable ?? true,
      maxStack: p.maxStack ?? 64,
      minToolTier: p.minToolTier ?? 0,
      drops: p.drops ?? true,
      light: p.light ?? 0,
    }
    this.props.set(id, def)
  }

  private registerDefaults() {
    this.set(BlockId.AIR, { name: '空气', hardness: 0, stackable: false, drops: false, maxStack: 0 })
    this.set(BlockId.GRASS, { name: '草方块', hardness: 0.6, minToolTier: 1 })
    this.set(BlockId.DIRT, { name: '泥土', hardness: 0.5, minToolTier: 1 })
    this.set(BlockId.STONE, { name: '石头', hardness: 1.5, minToolTier: 2 })
    this.set(BlockId.COBBLESTONE, { name: '圆石', hardness: 2.0, minToolTier: 1 })
    this.set(BlockId.SAND, { name: '沙子', hardness: 0.5, minToolTier: 1 })
    this.set(BlockId.GRAVEL, { name: '砾石', hardness: 0.6, minToolTier: 1 })
    this.set(BlockId.BEDROCK, { name: '基岩', hardness: -1, drops: false })
    this.set(BlockId.SNOW_BLOCK, { name: '雪块', hardness: 0.2, minToolTier: 1 })
    this.set(BlockId.CLAY, { name: '粘土', hardness: 0.6, minToolTier: 1 })
    this.set(BlockId.OAK_LOG, { name: '橡木原木', hardness: 2.0, minToolTier: 1 })
    this.set(BlockId.OAK_LEAVES, { name: '橡木树叶', hardness: 0.2 })
    this.set(BlockId.OAK_PLANKS, { name: '橡木木板', hardness: 1.5, minToolTier: 1 })
    this.set(BlockId.SPRUCE_LOG, { name: '云杉原木', hardness: 2.0, minToolTier: 1 })
    this.set(BlockId.SPRUCE_LEAVES, { name: '云杉树叶', hardness: 0.2 })
    this.set(BlockId.COAL_ORE, { name: '煤矿石', hardness: 3.0, minToolTier: 1 })
    this.set(BlockId.IRON_ORE, { name: '铁矿石', hardness: 3.0, minToolTier: 2 })
    this.set(BlockId.GOLD_ORE, { name: '金矿石', hardness: 3.0, minToolTier: 3 })
    this.set(BlockId.DIAMOND_ORE, { name: '钻石矿石', hardness: 3.0, minToolTier: 3 })
    this.set(BlockId.REDSTONE_ORE, { name: '红石矿石', hardness: 3.0, minToolTier: 3 })
    this.set(BlockId.WATER, { name: '水', hardness: 100, stackable: false, drops: false })
    this.set(BlockId.LAVA, { name: '熔岩', hardness: 100, stackable: false, drops: false, light: 15 })
    this.set(BlockId.GLASS, { name: '玻璃', hardness: 0.3, minToolTier: 1 })
    this.set(BlockId.TNT, { name: 'TNT', hardness: 0 })
    this.set(BlockId.GRASS_PATH, { name: '草径', hardness: 0.6, minToolTier: 1 })
    this.set(BlockId.CRAFTING_TABLE, { name: '工作台', hardness: 2.5, minToolTier: 1 })
    this.set(BlockId.FURNACE, { name: '熔炉', hardness: 3.5, minToolTier: 1 })
    this.set(BlockId.CHEST, { name: '箱子', hardness: 2.5, minToolTier: 1 })
    this.set(BlockId.TORCH, { name: '火把', hardness: 0, light: 14 })
    this.set(BlockId.GLOWSTONE, { name: '萤石', hardness: 0.3, light: 15 })
    this.set(BlockId.FLOWER_RED, { name: '红色花', hardness: 0 })
    this.set(BlockId.FLOWER_YELLOW, { name: '黄色花', hardness: 0 })
    this.set(BlockId.TALL_GRASS, { name: '高草', hardness: 0 })
    this.set(BlockId.CACTUS, { name: '仙人掌', hardness: 0.4 })
    this.set(BlockId.BOOKSHELF, { name: '书架', hardness: 1.5, minToolTier: 1 })
    this.set(BlockId.BED, { name: '床', hardness: 0.2 })
    this.set(BlockId.WHEAT, { name: '小麦', hardness: 0 })
    // 熔炼产物
    this.set(BlockId.IRON_INGOT, { name: '铁锭', maxStack: 64 })
    this.set(BlockId.GOLD_INGOT, { name: '金锭', maxStack: 64 })
    this.set(BlockId.DIAMOND, { name: '钻石', maxStack: 64 })
    this.set(BlockId.COAL, { name: '煤炭', maxStack: 64 })
    // 工具
    this.set(BlockId.STICK, { name: '木棍', maxStack: 64 })
    this.set(BlockId.WOODEN_PICKAXE, { name: '木镐', maxStack: 1, hardness: 0 })
    this.set(BlockId.WOODEN_SWORD, { name: '木剑', maxStack: 1, hardness: 0 })
    this.set(BlockId.WOODEN_SHOVEL, { name: '木锹', maxStack: 1, hardness: 0 })
    this.set(BlockId.WOODEN_AXE, { name: '木斧', maxStack: 1, hardness: 0 })
    this.set(BlockId.WOODEN_HOE, { name: '木锄', maxStack: 1, hardness: 0 })
    this.set(BlockId.STONE_PICKAXE, { name: '石镐', maxStack: 1, hardness: 0 })
    this.set(BlockId.STONE_SWORD, { name: '石剑', maxStack: 1, hardness: 0 })
    this.set(BlockId.IRON_PICKAXE, { name: '铁镐', maxStack: 1, hardness: 0 })
    this.set(BlockId.IRON_SWORD, { name: '铁剑', maxStack: 1, hardness: 0 })
    this.set(BlockId.DIAMOND_PICKAXE, { name: '钻石镐', maxStack: 1, hardness: 0 })
    this.set(BlockId.DIAMOND_SWORD, { name: '钻石剑', maxStack: 1, hardness: 0 })
    this.set(BlockId.BREAD, { name: '面包', maxStack: 64 })
    this.set(BlockId.FLINT, { name: '燧石', maxStack: 64 })
    this.set(BlockId.BOOK, { name: '书', maxStack: 64 })
    this.set(BlockId.GLOWSTONE_DUST, { name: '萤石粉', maxStack: 64 })
    this.set(BlockId.GUNPOWDER, { name: '火药', maxStack: 64 })
  }

  get(id: BlockId): BlockProperties {
    return this.props.get(id) ?? {
      name: 'Unknown', hardness: 1, stackable: true, maxStack: 64, minToolTier: 0, drops: true, light: 0
    }
  }

  /** 给定方块 + 工具镐等级，返回挖掘所需时间（tick） */
  breakTime(id: BlockId, toolTier: number, isCreative: boolean): number {
    if (isCreative) return 0
    const p = this.get(id)
    if (p.hardness < 0) return Infinity
    if (p.hardness === 0) return 0
    const req = p.minToolTier
    const multiplier = toolTier >= req ? (toolTier >= 3 ? 8 : toolTier >= 2 ? 4 : 2) : 3.33
    return Math.max(1, Math.round(p.hardness * multiplier * 20 / 3))
  }
}

export const registry = new BlockRegistry()
export { isBlockIdSolid, isBlockIdTransparent, isBlockIdFluid, isBlockIdLightSource }
