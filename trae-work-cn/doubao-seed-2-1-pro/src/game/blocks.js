export const WORLD_SIZE_X = 128;
export const WORLD_SIZE_Y = 64;
export const WORLD_SIZE_Z = 128;

export const WORLD_SIZE = {
  x: WORLD_SIZE_X,
  y: WORLD_SIZE_Y,
  z: WORLD_SIZE_Z
};

export const AIR = 0;
export const GRASS = 1;
export const DIRT = 2;
export const STONE = 3;
export const COBBLESTONE = 4;
export const OAK_PLANKS = 5;
export const OAK_LOG = 6;
export const LEAVES = 7;
export const SAND = 8;
export const WATER = 9;
export const GLASS = 10;
export const BRICKS = 11;
export const BEDROCK = 12;

export const BLOCKS = {
  [AIR]: {
    id: AIR,
    name: '空气',
    color: '#000000',
    transparent: true,
    hardness: 0,
    solid: false
  },
  [GRASS]: {
    id: GRASS,
    name: '草方块',
    color: {
      top: '#5D9B3C',
      side: '#8B5A2B',
      bottom: '#8B5A2B'
    },
    transparent: false,
    hardness: 0.6,
    solid: true
  },
  [DIRT]: {
    id: DIRT,
    name: '泥土',
    color: '#8B5A2B',
    transparent: false,
    hardness: 0.5,
    solid: true
  },
  [STONE]: {
    id: STONE,
    name: '石头',
    color: '#808080',
    transparent: false,
    hardness: 1.5,
    solid: true
  },
  [COBBLESTONE]: {
    id: COBBLESTONE,
    name: '圆石',
    color: '#6A6A6A',
    transparent: false,
    hardness: 2.0,
    solid: true
  },
  [OAK_PLANKS]: {
    id: OAK_PLANKS,
    name: '橡木木板',
    color: '#C4A06A',
    transparent: false,
    hardness: 2.0,
    solid: true
  },
  [OAK_LOG]: {
    id: OAK_LOG,
    name: '橡木原木',
    color: {
      top: '#A08050',
      side: '#6B4E2A',
      bottom: '#A08050'
    },
    transparent: false,
    hardness: 2.0,
    solid: true
  },
  [LEAVES]: {
    id: LEAVES,
    name: '树叶',
    color: '#3A7D26',
    transparent: true,
    hardness: 0.2,
    solid: true
  },
  [SAND]: {
    id: SAND,
    name: '沙子',
    color: '#E8D49A',
    transparent: false,
    hardness: 0.5,
    solid: true
  },
  [WATER]: {
    id: WATER,
    name: '水',
    color: '#3B7DD8',
    transparent: true,
    hardness: 100,
    solid: false
  },
  [GLASS]: {
    id: GLASS,
    name: '玻璃',
    color: '#C0E0F0',
    transparent: true,
    hardness: 0.3,
    solid: true
  },
  [BRICKS]: {
    id: BRICKS,
    name: '砖块',
    color: '#9B4A3A',
    transparent: false,
    hardness: 2.0,
    solid: true
  },
  [BEDROCK]: {
    id: BEDROCK,
    name: '基岩',
    color: '#2A2A2A',
    transparent: false,
    hardness: Infinity,
    solid: true
  }
};

export const BLOCK_LIST = Object.values(BLOCKS).filter(block => block.id !== AIR);

export const HOTBAR_BLOCKS = [
  GRASS,
  DIRT,
  STONE,
  OAK_PLANKS,
  OAK_LOG,
  LEAVES,
  SAND,
  GLASS,
  BRICKS
];

export function isSolid(id) {
  return BLOCKS[id]?.solid ?? false;
}

export function isTransparent(id) {
  return BLOCKS[id]?.transparent ?? true;
}

export function getBlockColor(id, face) {
  const block = BLOCKS[id];
  if (!block) return '#000000';
  if (typeof block.color === 'string') {
    return block.color;
  }
  if (face === 'top') return block.color.top;
  if (face === 'bottom') return block.color.bottom;
  return block.color.side;
}
