import * as THREE from 'three'
import { BlockType } from './Block.js'

export class TextureAtlas {
  constructor() {
    this.tileSize = 16
    this.atlasSize = 256 // 16x16 tiles
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.atlasSize
    this.canvas.height = this.atlasSize
    this.ctx = this.canvas.getContext('2d')
    
    this.texture = null
    this.tileMap = new Map() // BlockType -> { top, side, bottom } tile indices
    
    this.generateTextures()
    this.createTexture()
  }

  generateTextures() {
    // 清空画布
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.atlasSize, this.atlasSize)

    let tileIndex = 0

    // 草方块
    this.tileMap.set(BlockType.GRASS, {
      top: tileIndex++,
      side: tileIndex++,
      bottom: tileIndex++
    })
    this.drawGrassTop(0)
    this.drawGrassSide(1)
    this.drawDirt(2)

    // 泥土
    this.tileMap.set(BlockType.DIRT, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawDirt(tileIndex++)

    // 石头
    this.tileMap.set(BlockType.STONE, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawStone(tileIndex++)

    // 木头
    this.tileMap.set(BlockType.WOOD, {
      top: tileIndex++,
      side: tileIndex++,
      bottom: tileIndex
    })
    this.drawWoodTop(tileIndex - 2)
    this.drawWoodSide(tileIndex - 1)

    // 树叶
    this.tileMap.set(BlockType.LEAVES, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawLeaves(tileIndex++)

    // 沙子
    this.tileMap.set(BlockType.SAND, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawSand(tileIndex++)

    // 水
    this.tileMap.set(BlockType.WATER, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawWater(tileIndex++)

    // 煤炭矿石
    this.tileMap.set(BlockType.COAL_ORE, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawOre(tileIndex++, '#2a2a2a')

    // 铁矿
    this.tileMap.set(BlockType.IRON_ORE, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawOre(tileIndex++, '#d4a574')

    // 钻石矿
    this.tileMap.set(BlockType.DIAMOND_ORE, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawOre(tileIndex++, '#5ee8e0')

    // 基岩
    this.tileMap.set(BlockType.BEDROCK, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawBedrock(tileIndex++)

    // 木板
    this.tileMap.set(BlockType.PLANKS, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawPlanks(tileIndex++)

    // 圆石
    this.tileMap.set(BlockType.COBBLESTONE, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawCobblestone(tileIndex++)

    // 玻璃
    this.tileMap.set(BlockType.GLASS, {
      top: tileIndex,
      side: tileIndex,
      bottom: tileIndex
    })
    this.drawGlass(tileIndex++)
  }

  drawGrassTop(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 绿色草地
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const shade = 0.8 + Math.random() * 0.2
        const r = Math.floor(100 * shade)
        const g = Math.floor(180 * shade)
        const b = Math.floor(80 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawGrassSide(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 上半部分草地
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < 4; py++) {
        const shade = 0.8 + Math.random() * 0.2
        const r = Math.floor(100 * shade)
        const g = Math.floor(180 * shade)
        const b = Math.floor(80 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
    // 下半部分泥土
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 4; py < this.tileSize; py++) {
        this.drawDirtPixel(x + px, y + py)
      }
    }
  }

  drawDirt(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        this.drawDirtPixel(x + px, y + py)
      }
    }
  }

  drawDirtPixel(px, py) {
    const shade = 0.7 + Math.random() * 0.3
    const r = Math.floor(134 * shade)
    const g = Math.floor(96 * shade)
    const b = Math.floor(67 * shade)
    this.ctx.fillStyle = `rgb(${r},${g},${b})`
    this.ctx.fillRect(px, py, 1, 1)
  }

  drawStone(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const shade = 0.6 + Math.random() * 0.3
        const gray = Math.floor(128 * shade)
        this.ctx.fillStyle = `rgb(${gray},${gray},${gray})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawWoodTop(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 年轮
    const centerX = x + this.tileSize / 2
    const centerY = y + this.tileSize / 2
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const dist = Math.sqrt((px - this.tileSize / 2) ** 2 + (py - this.tileSize / 2) ** 2)
        const ring = Math.sin(dist * 2) * 0.2 + 0.8
        const shade = ring * (0.7 + Math.random() * 0.3)
        const r = Math.floor(139 * shade)
        const g = Math.floor(90 * shade)
        const b = Math.floor(43 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawWoodSide(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 木纹
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const stripe = Math.sin(py * 0.5) * 0.1 + 0.9
        const shade = stripe * (0.7 + Math.random() * 0.3)
        const r = Math.floor(139 * shade)
        const g = Math.floor(90 * shade)
        const b = Math.floor(43 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawLeaves(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const shade = 0.6 + Math.random() * 0.4
        const r = Math.floor(50 * shade)
        const g = Math.floor(150 * shade)
        const b = Math.floor(50 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawSand(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const shade = 0.8 + Math.random() * 0.2
        const r = Math.floor(220 * shade)
        const g = Math.floor(200 * shade)
        const b = Math.floor(150 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawWater(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const wave = Math.sin(px * 0.5 + py * 0.3) * 0.1 + 0.9
        const shade = wave * (0.7 + Math.random() * 0.3)
        const r = Math.floor(50 * shade)
        const g = Math.floor(100 * shade)
        const b = Math.floor(200 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawOre(tileIndex, oreColor) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 石头背景
    this.drawStone(tileIndex)
    // 矿石斑点
    const oreRgb = this.hexToRgb(oreColor)
    for (let i = 0; i < 8; i++) {
      const px = Math.floor(Math.random() * this.tileSize)
      const py = Math.floor(Math.random() * this.tileSize)
      this.ctx.fillStyle = oreColor
      this.ctx.fillRect(x + px, y + py, 2, 2)
    }
  }

  drawBedrock(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const shade = 0.3 + Math.random() * 0.3
        const gray = Math.floor(80 * shade)
        this.ctx.fillStyle = `rgb(${gray},${gray},${gray})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawPlanks(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const plank = Math.floor(py / 4)
        const shade = (plank % 2 === 0 ? 0.9 : 0.85) * (0.8 + Math.random() * 0.2)
        const r = Math.floor(180 * shade)
        const g = Math.floor(140 * shade)
        const b = Math.floor(80 * shade)
        this.ctx.fillStyle = `rgb(${r},${g},${b})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawCobblestone(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    for (let px = 0; px < this.tileSize; px++) {
      for (let py = 0; py < this.tileSize; py++) {
        const noise = Math.sin(px * 0.8) * Math.cos(py * 0.8) * 0.2 + 0.8
        const shade = noise * (0.6 + Math.random() * 0.3)
        const gray = Math.floor(128 * shade)
        this.ctx.fillStyle = `rgb(${gray},${gray},${gray})`
        this.ctx.fillRect(x + px, y + py, 1, 1)
      }
    }
  }

  drawGlass(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    // 透明玻璃
    this.ctx.fillStyle = 'rgba(200, 230, 255, 0.3)'
    this.ctx.fillRect(x, y, this.tileSize, this.tileSize)
    // 边框
    this.ctx.strokeStyle = 'rgba(180, 210, 240, 0.8)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x + 0.5, y + 0.5, this.tileSize - 1, this.tileSize - 1)
  }

  getTilePosition(tileIndex) {
    const tilesPerRow = this.atlasSize / this.tileSize
    const x = (tileIndex % tilesPerRow) * this.tileSize
    const y = Math.floor(tileIndex / tilesPerRow) * this.tileSize
    return { x, y }
  }

  getUV(tileIndex) {
    const { x, y } = this.getTilePosition(tileIndex)
    const u0 = x / this.atlasSize
    const v0 = 1 - (y + this.tileSize) / this.atlasSize
    const u1 = (x + this.tileSize) / this.atlasSize
    const v1 = 1 - y / this.atlasSize
    return { u0, v0, u1, v1 }
  }

  createTexture() {
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.magFilter = THREE.NearestFilter
    this.texture.minFilter = THREE.NearestFilter
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }
}
