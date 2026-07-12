import * as THREE from 'three'

export const BlockType = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAVES: 5,
  SAND: 6,
  WATER: 7,
  GLASS: 8,
  WORKBENCH: 9,
  BRICK: 10,
  SNOW: 11,
  CACTUS: 12
}

export const BlockData = {
  [BlockType.AIR]: {
    name: '空气',
    transparent: true,
    solid: false
  },
  [BlockType.GRASS]: {
    name: '草方块',
    transparent: false,
    solid: true
  },
  [BlockType.DIRT]: {
    name: '泥土',
    transparent: false,
    solid: true
  },
  [BlockType.STONE]: {
    name: '石头',
    transparent: false,
    solid: true
  },
  [BlockType.WOOD]: {
    name: '木头',
    transparent: false,
    solid: true
  },
  [BlockType.LEAVES]: {
    name: '树叶',
    transparent: true,
    solid: true
  },
  [BlockType.SAND]: {
    name: '沙子',
    transparent: false,
    solid: true
  },
  [BlockType.WATER]: {
    name: '水',
    transparent: true,
    solid: false
  },
  [BlockType.GLASS]: {
    name: '玻璃',
    transparent: true,
    solid: true
  },
  [BlockType.WORKBENCH]: {
    name: '工作台',
    transparent: false,
    solid: true
  },
  [BlockType.BRICK]: {
    name: '砖块',
    transparent: false,
    solid: true
  },
  [BlockType.SNOW]: {
    name: '雪花块',
    transparent: false,
    solid: true
  },
  [BlockType.CACTUS]: {
    name: '仙人掌',
    transparent: false,
    solid: true
  }
}

export const BlockNames = {}
export const BlockTransparent = {}
export const BlockSolid = {}

for (const [key, value] of Object.entries(BlockData)) {
  const id = BlockType[key]
  BlockNames[id] = value.name
  BlockTransparent[id] = value.transparent
  BlockSolid[id] = value.solid
}

function createPixelCanvas(size = 16) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

function noisePixel(ctx, x, y, baseColor, variance) {
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  const v = Math.floor(Math.random() * variance * 2) - variance
  const nr = Math.max(0, Math.min(255, r + v))
  const ng = Math.max(0, Math.min(255, g + v))
  const nb = Math.max(0, Math.min(255, b + v))
  ctx.fillStyle = `rgb(${nr},${ng},${nb})`
  ctx.fillRect(x, y, 1, 1)
}

function generateGrassTop(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#4caf50', 20)
    }
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * 16)
    const y = Math.floor(Math.random() * 16)
    ctx.fillStyle = '#2e7d32'
    ctx.fillRect(x, y, 1, 1)
  }
}

function generateGrassSide(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#8b5e3c', 15)
    }
  }
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#4caf50', 20)
    }
  }
  for (let y = 3; y < 6; y++) {
    for (let x = 0; x < 16; x++) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#4caf50'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}

function generateDirt(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#8b5e3c', 20)
    }
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * 16)
    const y = Math.floor(Math.random() * 16)
    ctx.fillStyle = '#5d4037'
    ctx.fillRect(x, y, 1, 1)
  }
}

function generateStone(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#9e9e9e', 20)
    }
  }
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(Math.random() * 14)
    const y = Math.floor(Math.random() * 14)
    ctx.fillStyle = '#757575'
    ctx.fillRect(x, y, 2, 2)
  }
}

function generateWoodSide(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#6d4c2e', 10)
    }
  }
  for (let x = 2; x < 16; x += 4) {
    for (let y = 0; y < 16; y++) {
      ctx.fillStyle = '#4e342e'
      ctx.fillRect(x, y, 1, 1)
    }
  }
  for (let y = 0; y < 16; y += 3) {
    for (let x = 0; x < 16; x++) {
      if (Math.random() > 0.6) {
        ctx.fillStyle = '#5d4037'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}

function generateWoodTop(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#a0764a', 10)
    }
  }
  ctx.strokeStyle = '#6d4c2e'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(8, 8, 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(8, 8, 3, 0, Math.PI * 2)
  ctx.stroke()
}

function generateLeaves(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (Math.random() > 0.15) {
        noisePixel(ctx, x, y, '#2e7d32', 25)
      }
    }
  }
  for (let i = 0; i < 20; i++) {
    const x = Math.floor(Math.random() * 16)
    const y = Math.floor(Math.random() * 16)
    ctx.fillStyle = '#1b5e20'
    ctx.fillRect(x, y, 1, 1)
  }
}

function generateSand(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#e8d48a', 12)
    }
  }
  for (let i = 0; i < 25; i++) {
    const x = Math.floor(Math.random() * 16)
    const y = Math.floor(Math.random() * 16)
    ctx.fillStyle = '#d4c06a'
    ctx.fillRect(x, y, 1, 1)
  }
}

function generateWater(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#42a5f5', 15)
    }
  }
  for (let y = 2; y < 16; y += 5) {
    for (let x = 0; x < 16; x++) {
      if (Math.random() > 0.4) {
        ctx.fillStyle = '#64b5f6'
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }
}

function generateGlass(ctx) {
  fillRect(ctx, 0, 0, 16, 16, '#bbdefb')
  ctx.strokeStyle = '#90caf9'
  ctx.lineWidth = 1
  ctx.strokeRect(0.5, 0.5, 15, 15)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(16, 16)
  ctx.stroke()
}

function generateWorkbenchTop(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#8b6914', 10)
    }
  }
  ctx.fillStyle = '#5d4037'
  ctx.fillRect(2, 2, 5, 5)
  ctx.fillRect(9, 2, 5, 5)
  ctx.fillRect(2, 9, 5, 5)
  ctx.fillRect(9, 9, 5, 5)
  ctx.fillStyle = '#8d6e63'
  ctx.fillRect(3, 3, 3, 3)
  ctx.fillRect(10, 3, 3, 3)
  ctx.fillRect(3, 10, 3, 3)
  ctx.fillRect(10, 10, 3, 3)
}

function generateWorkbenchSide(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#6d4c2e', 10)
    }
  }
  ctx.fillStyle = '#8b6914'
  ctx.fillRect(0, 0, 16, 4)
  for (let x = 0; x < 16; x += 4) {
    ctx.fillStyle = '#4e342e'
    ctx.fillRect(x, 4, 1, 12)
  }
}

function generateBrick(ctx) {
  fillRect(ctx, 0, 0, 16, 16, '#c62828')
  ctx.strokeStyle = '#8d6e63'
  ctx.lineWidth = 1
  for (let y = 0; y < 16; y += 4) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(16, y)
    ctx.stroke()
  }
  for (let y = 0; y < 16; y += 8) {
    for (let x = 0; x < 16; x += 8) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + 4)
      ctx.stroke()
    }
  }
  for (let y = 4; y < 16; y += 8) {
    for (let x = 4; x < 16; x += 8) {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + 4)
      ctx.stroke()
    }
  }
  for (let y = 1; y < 16; y += 4) {
    for (let x = 1; x < 16; x++) {
      if (Math.random() > 0.7) {
        ctx.fillStyle = '#b71c1c'
        ctx.fillRect(x, y, 1, 2)
      }
    }
  }
}

function generateSnow(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#f5f5f5', 8)
    }
  }
  for (let i = 0; i < 15; i++) {
    const x = Math.floor(Math.random() * 16)
    const y = Math.floor(Math.random() * 16)
    ctx.fillStyle = '#eeeeee'
    ctx.fillRect(x, y, 1, 1)
  }
}

function generateCactusSide(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#2e7d32', 15)
    }
  }
  for (let y = 2; y < 16; y += 3) {
    for (let x = 1; x < 16; x += 2) {
      ctx.fillStyle = '#1b5e20'
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = '#4caf50'
  ctx.fillRect(0, 0, 2, 16)
  ctx.fillRect(14, 0, 2, 16)
}

function generateCactusTop(ctx) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      noisePixel(ctx, x, y, '#388e3c', 15)
    }
  }
  ctx.strokeStyle = '#2e7d32'
  ctx.lineWidth = 1
  ctx.strokeRect(1, 1, 14, 14)
  ctx.strokeRect(4, 4, 8, 8)
}

const generators = {
  [BlockType.GRASS]: {
    top: generateGrassTop,
    side: generateGrassSide,
    bottom: generateDirt
  },
  [BlockType.DIRT]: {
    all: generateDirt
  },
  [BlockType.STONE]: {
    all: generateStone
  },
  [BlockType.WOOD]: {
    top: generateWoodTop,
    side: generateWoodSide,
    bottom: generateWoodTop
  },
  [BlockType.LEAVES]: {
    all: generateLeaves
  },
  [BlockType.SAND]: {
    all: generateSand
  },
  [BlockType.WATER]: {
    all: generateWater
  },
  [BlockType.GLASS]: {
    all: generateGlass
  },
  [BlockType.WORKBENCH]: {
    top: generateWorkbenchTop,
    side: generateWorkbenchSide,
    bottom: generateDirt
  },
  [BlockType.BRICK]: {
    all: generateBrick
  },
  [BlockType.SNOW]: {
    all: generateSnow
  },
  [BlockType.CACTUS]: {
    top: generateCactusTop,
    side: generateCactusSide,
    bottom: generateCactusTop
  }
}

export function generateBlockTexture(blockType, face = 'all') {
  const gen = generators[blockType]
  if (!gen) return null

  const canvas = createPixelCanvas(16)
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  let generator
  if (gen.all) {
    generator = gen.all
  } else if (face === 'top') {
    generator = gen.top
  } else if (face === 'bottom') {
    generator = gen.bottom
  } else {
    generator = gen.side
  }

  if (generator) {
    generator(ctx)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

export function generateBlockMaterials(blockType) {
  const data = BlockData[blockType]
  if (!data) return null

  const transparent = data.transparent
  const opacity = blockType === BlockType.WATER ? 0.7 : blockType === BlockType.GLASS ? 0.5 : 1

  const gen = generators[blockType]
  if (!gen) return null

  if (gen.all) {
    const tex = generateBlockTexture(blockType, 'all')
    const mat = new THREE.MeshLambertMaterial({
      map: tex,
      transparent,
      opacity
    })
    return [mat, mat, mat, mat, mat, mat]
  }

  const topTex = generateBlockTexture(blockType, 'top')
  const bottomTex = generateBlockTexture(blockType, 'bottom')
  const sideTex = generateBlockTexture(blockType, 'side')

  const topMat = new THREE.MeshLambertMaterial({ map: topTex, transparent, opacity })
  const bottomMat = new THREE.MeshLambertMaterial({ map: bottomTex, transparent, opacity })
  const sideMat = new THREE.MeshLambertMaterial({ map: sideTex, transparent, opacity })

  return [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat]
}

export const HotbarBlocks = [
  BlockType.GRASS,
  BlockType.DIRT,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.LEAVES,
  BlockType.SAND,
  BlockType.BRICK,
  BlockType.GLASS,
  BlockType.CACTUS
]
