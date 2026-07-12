export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  DIAMOND_ORE: 10,
  BEDROCK: 11,
  PLANKS: 12,
  COBBLESTONE: 13,
  GLASS: 14
}

export const BlockData = {
  [BlockType.AIR]: {
    name: 'Air',
    solid: false,
    transparent: true
  },
  [BlockType.GRASS]: {
    name: 'Grass',
    solid: true,
    transparent: false
  },
  [BlockType.DIRT]: {
    name: 'Dirt',
    solid: true,
    transparent: false
  },
  [BlockType.STONE]: {
    name: 'Stone',
    solid: true,
    transparent: false
  },
  [BlockType.WOOD]: {
    name: 'Wood',
    solid: true,
    transparent: false
  },
  [BlockType.LEAVES]: {
    name: 'Leaves',
    solid: true,
    transparent: false
  },
  [BlockType.SAND]: {
    name: 'Sand',
    solid: true,
    transparent: false
  },
  [BlockType.WATER]: {
    name: 'Water',
    solid: false,
    transparent: true
  },
  [BlockType.COAL_ORE]: {
    name: 'Coal Ore',
    solid: true,
    transparent: false
  },
  [BlockType.IRON_ORE]: {
    name: 'Iron Ore',
    solid: true,
    transparent: false
  },
  [BlockType.DIAMOND_ORE]: {
    name: 'Diamond Ore',
    solid: true,
    transparent: false
  },
  [BlockType.BEDROCK]: {
    name: 'Bedrock',
    solid: true,
    transparent: false
  },
  [BlockType.PLANKS]: {
    name: 'Planks',
    solid: true,
    transparent: false
  },
  [BlockType.COBBLESTONE]: {
    name: 'Cobblestone',
    solid: true,
    transparent: false
  },
  [BlockType.GLASS]: {
    name: 'Glass',
    solid: true,
    transparent: true
  }
}
