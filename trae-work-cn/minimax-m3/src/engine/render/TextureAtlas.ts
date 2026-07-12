import { BlockId } from '../world/BlockId'

/**
 * 纹理图集：使用 Canvas 程序化生成 16x16 方块纹理。
 * 每张纹理 16x16 px，按 16x16 网格打包成 256x256 atlas。
 *
 * 顶面 / 侧面 / 底面可能使用不同纹理索引。
 * 索引约定：[top, side, bottom, special]
 */
export interface BlockTexture {
  top: number
  side: number
  bottom: number
}

export class TextureAtlas {
  readonly size = 16
  readonly tile = 16
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
  /** 颜色采样辅助 */
  private images: { [key: string]: HTMLImageElement } = {}
  readonly textures: Map<BlockId, BlockTexture> = new Map()

  constructor() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.size * this.tile
    this.canvas.height = this.size * this.tile
    this.ctx = this.canvas.getContext('2d')!
    this.drawAll()
  }

  private tileAt(idx: number, draw: (ctx: CanvasRenderingContext2D, x: number, y: number) => void) {
    const tx = (idx % this.size) * this.tile
    const ty = Math.floor(idx / this.size) * this.tile
    this.ctx.save()
    this.ctx.translate(tx, ty)
    const sub = this.ctx
    draw(sub, 0, 0)
    this.ctx.restore()
  }

  private fill(c: string) {
    this.ctx.fillStyle = c
    this.ctx.fillRect(0, 0, this.tile, this.tile)
  }

  private pixelNoise(seed: number, density: number, color: [number, number, number]) {
    // 给定一个种子放置杂色像素
    const rng = mulberry(seed)
    const count = this.tile * this.tile * density
    for (let i = 0; i < count; i++) {
      const x = Math.floor(rng() * this.tile)
      const y = Math.floor(rng() * this.tile)
      this.ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`
      this.ctx.fillRect(x, y, 1, 1)
    }
  }

  private drawAll() {
    // 0 = grass top
    this.tileAt(0, (c) => {
      c.fillStyle = '#5fa13e'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.1, [60, 130, 50])
      this.pixelNoiseAt(c, 1, 0.05, [40, 100, 30])
    })
    // 1 = grass side (dirt with grass overhang)
    this.tileAt(1, (c) => {
      c.fillStyle = '#8b5a2b'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#5fa13e'
      c.fillRect(0, 0, 16, 4)
      // grass drip
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * 16)
        c.fillRect(x, 4, 1, 1 + Math.floor(Math.random() * 3))
      }
      this.pixelNoiseAt(c, 1, 0.15, [110, 80, 50])
    })
    // 2 = dirt
    this.tileAt(2, (c) => {
      c.fillStyle = '#8b5a2b'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.2, [110, 80, 50])
      this.pixelNoiseAt(c, 1, 0.05, [60, 40, 25])
    })
    // 3 = stone
    this.tileAt(3, (c) => {
      c.fillStyle = '#7e7e7e'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.2, [100, 100, 100])
      this.pixelNoiseAt(c, 1, 0.05, [55, 55, 55])
    })
    // 4 = cobblestone
    this.tileAt(4, (c) => {
      c.fillStyle = '#6b6b6b'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#3a3a3a'; c.lineWidth = 1
      c.beginPath()
      c.moveTo(8, 0); c.lineTo(8, 6)
      c.moveTo(0, 8); c.lineTo(6, 8); c.moveTo(10, 8); c.lineTo(16, 8)
      c.moveTo(4, 12); c.lineTo(12, 12)
      c.moveTo(2, 4); c.lineTo(6, 4)
      c.moveTo(10, 4); c.lineTo(14, 4)
      c.stroke()
      c.fillStyle = '#7d7d7d'
      c.fillRect(2, 2, 4, 2)
      c.fillRect(10, 2, 4, 2)
      c.fillRect(2, 10, 4, 2)
      c.fillRect(10, 10, 4, 2)
    })
    // 5 = sand
    this.tileAt(5, (c) => {
      c.fillStyle = '#e6d6a0'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.1, [200, 180, 130])
      this.pixelNoiseAt(c, 1, 0.03, [170, 150, 100])
    })
    // 6 = gravel
    this.tileAt(6, (c) => {
      c.fillStyle = '#888'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#666'
      c.fillRect(1, 2, 3, 2); c.fillRect(8, 1, 4, 3)
      c.fillRect(4, 8, 4, 3); c.fillRect(11, 9, 3, 2)
      c.fillStyle = '#aaa'
      c.fillRect(2, 6, 2, 2); c.fillRect(10, 6, 2, 2)
    })
    // 7 = bedrock
    this.tileAt(7, (c) => {
      c.fillStyle = '#3a3a3a'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.3, [60, 60, 60])
      this.pixelNoiseAt(c, 1, 0.1, [20, 20, 20])
    })
    // 8 = snow
    this.tileAt(8, (c) => {
      c.fillStyle = '#f5f8ff'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.05, [200, 220, 240])
    })
    // 9 = clay
    this.tileAt(9, (c) => {
      c.fillStyle = '#a4b6c4'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.1, [120, 140, 160])
    })
    // 10 = oak log top (rings)
    this.tileAt(10, (c) => {
      c.fillStyle = '#b58c5a'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#7a5832'; c.lineWidth = 1
      c.beginPath()
      c.arc(8, 8, 6, 0, Math.PI * 2); c.stroke()
      c.beginPath()
      c.arc(8, 8, 3, 0, Math.PI * 2); c.stroke()
      c.fillStyle = '#8a6238'
      c.fillRect(3, 3, 1, 1); c.fillRect(12, 12, 1, 1)
    })
    // 11 = oak log side
    this.tileAt(11, (c) => {
      c.fillStyle = '#7a5832'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#5a3f1f'
      c.fillRect(4, 0, 1, 16)
      c.fillRect(11, 0, 1, 16)
      c.fillStyle = '#9c7244'
      c.fillRect(2, 0, 1, 16)
      c.fillRect(13, 0, 1, 16)
    })
    // 12 = oak leaves
    this.tileAt(12, (c) => {
      c.fillStyle = '#3e8a2a'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.3, [60, 130, 50])
      this.pixelNoiseAt(c, 1, 0.1, [30, 90, 30])
    })
    // 13 = planks
    this.tileAt(13, (c) => {
      c.fillStyle = '#b88a4a'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#6e4a1f'; c.lineWidth = 1
      c.beginPath()
      c.moveTo(0, 4); c.lineTo(16, 4)
      c.moveTo(0, 11); c.lineTo(16, 11)
      c.stroke()
    })
    // 14 = spruce log top
    this.tileAt(14, (c) => {
      c.fillStyle = '#6a4a2a'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#3a2a1a'; c.lineWidth = 1
      c.beginPath()
      c.arc(8, 8, 6, 0, Math.PI * 2); c.stroke()
    })
    // 15 = spruce log side
    this.tileAt(15, (c) => {
      c.fillStyle = '#3a2a1a'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#5a3a1a'
      c.fillRect(2, 0, 1, 16)
      c.fillRect(7, 0, 1, 16)
      c.fillRect(12, 0, 1, 16)
    })
    // 16 = spruce leaves
    this.tileAt(16, (c) => {
      c.fillStyle = '#2a5a20'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.3, [60, 110, 50])
    })
    // 17 = coal ore
    this.tileAt(17, (c) => {
      c.fillStyle = '#7e7e7e'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#222'
      c.fillRect(3, 3, 2, 2); c.fillRect(8, 6, 2, 2); c.fillRect(12, 10, 2, 2)
      c.fillRect(5, 11, 2, 2); c.fillRect(10, 3, 2, 2)
    })
    // 18 = iron ore
    this.tileAt(18, (c) => {
      c.fillStyle = '#a89478'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#d4a872'
      c.fillRect(3, 4, 2, 2); c.fillRect(9, 7, 2, 2); c.fillRect(12, 11, 2, 2)
    })
    // 19 = gold ore
    this.tileAt(19, (c) => {
      c.fillStyle = '#7e7e7e'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#e8c250'
      c.fillRect(3, 4, 2, 2); c.fillRect(9, 7, 2, 2); c.fillRect(12, 11, 2, 2)
    })
    // 20 = diamond ore
    this.tileAt(20, (c) => {
      c.fillStyle = '#7e7e7e'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#6cf'
      c.fillRect(3, 4, 2, 2); c.fillRect(9, 7, 2, 2); c.fillRect(12, 11, 2, 2)
    })
    // 21 = redstone ore
    this.tileAt(21, (c) => {
      c.fillStyle = '#7e7e7e'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#e44'
      c.fillRect(3, 4, 2, 2); c.fillRect(9, 7, 2, 2); c.fillRect(12, 11, 2, 2)
    })
    // 22 = water
    this.tileAt(22, (c) => {
      c.fillStyle = 'rgba(60, 100, 220, 0.7)'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = 'rgba(120, 160, 255, 0.5)'
      c.fillRect(0, 0, 16, 4)
    })
    // 23 = lava
    this.tileAt(23, (c) => {
      c.fillStyle = '#d04a14'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#f0a040'
      c.fillRect(2, 2, 4, 4); c.fillRect(10, 10, 4, 4)
    })
    // 24 = glass
    this.tileAt(24, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.strokeStyle = '#cfe'; c.lineWidth = 1
      c.strokeRect(0, 0, 16, 16)
    })
    // 25 = tnt
    this.tileAt(25, (c) => {
      c.fillStyle = '#cc2a2a'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#fff'
      c.fillRect(2, 2, 12, 12)
      c.fillStyle = '#cc2a2a'
      c.font = 'bold 12px monospace'
      c.fillText('T', 4, 12)
      c.fillText('T', 9, 12)
    })
    // 26 = grass path
    this.tileAt(26, (c) => {
      c.fillStyle = '#a08558'; c.fillRect(0, 0, 16, 16)
      this.pixelNoiseAt(c, 1, 0.2, [80, 60, 30])
    })
    // 27 = crafting table top
    this.tileAt(27, (c) => {
      c.fillStyle = '#8a6238'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#4a3018'; c.lineWidth = 1
      c.strokeRect(1, 1, 5, 5)
      c.strokeRect(10, 1, 5, 5)
      c.strokeRect(1, 10, 5, 5)
      c.strokeRect(10, 10, 5, 5)
    })
    // 28 = crafting table side
    this.tileAt(28, (c) => {
      c.fillStyle = '#6a4220'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#3a2010'
      c.fillRect(0, 6, 16, 2)
      c.fillStyle = '#b88a4a'
      c.fillRect(0, 8, 16, 1)
      c.fillRect(2, 2, 2, 2)
      c.fillRect(8, 3, 2, 2)
    })
    // 29 = furnace top
    this.tileAt(29, (c) => {
      c.fillStyle = '#444'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#222'
      c.fillRect(2, 2, 12, 12)
    })
    // 30 = furnace side
    this.tileAt(30, (c) => {
      c.fillStyle = '#666'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#333'
      c.fillRect(3, 4, 10, 8)
      c.fillStyle = '#222'
      c.fillRect(4, 5, 8, 6)
    })
    // 31 = torch
    this.tileAt(31, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 4, 2, 12)
      c.fillStyle = '#ffb84a'
      c.fillRect(5, 0, 6, 6)
      c.fillStyle = '#fff7c0'
      c.fillRect(6, 1, 4, 4)
    })
    // 32 = glowstone
    this.tileAt(32, (c) => {
      c.fillStyle = '#e0c060'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#fce58a'
      c.fillRect(2, 2, 4, 4); c.fillRect(10, 4, 4, 4)
      c.fillRect(5, 10, 6, 4)
    })
    // 33 = flower red
    this.tileAt(33, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#3a8a2a'
      c.fillRect(7, 8, 2, 8)
      c.fillStyle = '#dc2a2a'
      c.beginPath()
      c.arc(8, 6, 4, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#ffea5a'
      c.beginPath(); c.arc(8, 6, 2, 0, Math.PI * 2); c.fill()
    })
    // 34 = flower yellow
    this.tileAt(34, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#3a8a2a'
      c.fillRect(7, 8, 2, 8)
      c.fillStyle = '#ffea5a'
      c.beginPath()
      c.arc(8, 6, 4, 0, Math.PI * 2); c.fill()
    })
    // 35 = tall grass
    this.tileAt(35, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#3a8a2a'
      c.fillRect(3, 8, 1, 8)
      c.fillRect(7, 4, 1, 12)
      c.fillRect(11, 9, 1, 7)
    })
    // 36 = cactus
    this.tileAt(36, (c) => {
      c.fillStyle = '#4a8a2a'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#3a6a1a'
      c.fillRect(2, 0, 1, 16)
      c.fillRect(13, 0, 1, 16)
    })
    // 37 = bookshelf
    this.tileAt(37, (c) => {
      c.fillStyle = '#8a6238'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#a04030'
      c.fillRect(1, 1, 4, 14)
      c.fillStyle = '#40a070'
      c.fillRect(6, 1, 4, 14)
      c.fillStyle = '#3060a0'
      c.fillRect(11, 1, 4, 14)
    })
    // 38 = bed top
    this.tileAt(38, (c) => {
      c.fillStyle = '#cc4040'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#ee7878'
      c.fillRect(0, 0, 16, 4)
    })
    // 39 = bed side
    this.tileAt(39, (c) => {
      c.fillStyle = '#aa3030'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#ee7878'
      c.fillRect(0, 0, 16, 6)
      c.fillStyle = '#7a5020'
      c.fillRect(0, 14, 16, 2)
    })
    // 40 = chest top
    this.tileAt(40, (c) => {
      c.fillStyle = '#8a6238'; c.fillRect(0, 0, 16, 16)
      c.strokeStyle = '#3a2010'; c.lineWidth = 1
      c.strokeRect(2, 2, 12, 12)
    })
    // 41 = chest side
    this.tileAt(41, (c) => {
      c.fillStyle = '#7a5020'; c.fillRect(0, 0, 16, 16)
      c.fillStyle = '#3a2010'
      c.fillRect(0, 0, 16, 2)
      c.fillStyle = '#aa7040'
      c.fillRect(7, 6, 2, 4)
    })

    // 物品图标（从方块顶部或单独绘制）
    // 200-300 = 物品
    // wooden pickaxe
    this.tileAt(200, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#8a6238'
      c.fillRect(4, 4, 8, 2)
      c.fillStyle = '#666'
      c.fillRect(5, 2, 1, 2)
      c.fillRect(7, 1, 1, 1)
      c.fillRect(9, 2, 1, 2)
    })
    // wooden sword
    this.tileAt(201, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 6, 2, 8)
      c.fillStyle = '#666'
      c.fillRect(5, 2, 6, 4)
    })
    // wooden shovel
    this.tileAt(202, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 7, 2, 7)
      c.fillStyle = '#888'
      c.fillRect(5, 2, 6, 5)
    })
    // wooden axe
    this.tileAt(203, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#666'
      c.fillRect(4, 2, 4, 6)
    })
    // wooden hoe
    this.tileAt(204, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#888'
      c.fillRect(4, 1, 4, 7)
    })
    // stick
    this.tileAt(240, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 2, 2, 12)
    })
    // iron ingot
    this.tileAt(110, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#dadada'
      c.fillRect(2, 6, 12, 6)
      c.fillStyle = '#f4f4f4'
      c.fillRect(2, 5, 12, 1)
    })
    // gold ingot
    this.tileAt(111, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#f4d044'
      c.fillRect(2, 6, 12, 6)
      c.fillStyle = '#fce588'
      c.fillRect(2, 5, 12, 1)
    })
    // diamond
    this.tileAt(112, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#5cf'
      c.fillRect(4, 4, 8, 8)
      c.fillStyle = '#cef'
      c.fillRect(5, 5, 2, 2)
    })
    // coal
    this.tileAt(113, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#222'
      c.fillRect(3, 4, 10, 8)
    })
    // wheat
    this.tileAt(100, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#d4a050'
      c.fillRect(6, 2, 4, 12)
      c.fillStyle = '#e0c070'
      c.fillRect(4, 4, 8, 4)
    })
    // bread
    this.tileAt(300, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#c08850'
      c.fillRect(2, 6, 12, 6)
      c.fillStyle = '#a06030'
      c.fillRect(2, 5, 12, 1)
    })
    // flint
    this.tileAt(400, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#444'
      c.fillRect(4, 6, 8, 6)
    })
    // stone pickaxe
    this.tileAt(210, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#7e7e7e'
      c.fillRect(4, 4, 8, 2)
    })
    // stone sword
    this.tileAt(211, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 6, 2, 8)
      c.fillStyle = '#7e7e7e'
      c.fillRect(5, 2, 6, 4)
    })
    // iron pickaxe
    this.tileAt(220, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#dadada'
      c.fillRect(4, 4, 8, 2)
    })
    // iron sword
    this.tileAt(221, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 6, 2, 8)
      c.fillStyle = '#dadada'
      c.fillRect(5, 2, 6, 4)
    })
    // diamond pickaxe
    this.tileAt(230, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 8, 2, 6)
      c.fillStyle = '#5cf'
      c.fillRect(4, 4, 8, 2)
    })
    // diamond sword
    this.tileAt(231, (c) => {
      c.clearRect(0, 0, 16, 16)
      c.fillStyle = '#8a6238'
      c.fillRect(7, 6, 2, 8)
      c.fillStyle = '#5cf'
      c.fillRect(5, 2, 6, 4)
    })

    // 注册方块纹理
    this.register(BlockId.GRASS, { top: 0, side: 1, bottom: 2 })
    this.register(BlockId.DIRT, { top: 2, side: 2, bottom: 2 })
    this.register(BlockId.STONE, { top: 3, side: 3, bottom: 3 })
    this.register(BlockId.COBBLESTONE, { top: 4, side: 4, bottom: 4 })
    this.register(BlockId.SAND, { top: 5, side: 5, bottom: 5 })
    this.register(BlockId.GRAVEL, { top: 6, side: 6, bottom: 6 })
    this.register(BlockId.BEDROCK, { top: 7, side: 7, bottom: 7 })
    this.register(BlockId.SNOW_BLOCK, { top: 8, side: 8, bottom: 8 })
    this.register(BlockId.CLAY, { top: 9, side: 9, bottom: 9 })
    this.register(BlockId.OAK_LOG, { top: 10, side: 11, bottom: 10 })
    this.register(BlockId.OAK_LEAVES, { top: 12, side: 12, bottom: 12 })
    this.register(BlockId.OAK_PLANKS, { top: 13, side: 13, bottom: 13 })
    this.register(BlockId.SPRUCE_LOG, { top: 14, side: 15, bottom: 14 })
    this.register(BlockId.SPRUCE_LEAVES, { top: 16, side: 16, bottom: 16 })
    this.register(BlockId.COAL_ORE, { top: 17, side: 17, bottom: 17 })
    this.register(BlockId.IRON_ORE, { top: 18, side: 18, bottom: 18 })
    this.register(BlockId.GOLD_ORE, { top: 19, side: 19, bottom: 19 })
    this.register(BlockId.DIAMOND_ORE, { top: 20, side: 20, bottom: 20 })
    this.register(BlockId.REDSTONE_ORE, { top: 21, side: 21, bottom: 21 })
    this.register(BlockId.WATER, { top: 22, side: 22, bottom: 22 })
    this.register(BlockId.LAVA, { top: 23, side: 23, bottom: 23 })
    this.register(BlockId.GLASS, { top: 24, side: 24, bottom: 24 })
    this.register(BlockId.TNT, { top: 25, side: 25, bottom: 25 })
    this.register(BlockId.GRASS_PATH, { top: 26, side: 26, bottom: 26 })
    this.register(BlockId.CRAFTING_TABLE, { top: 27, side: 28, bottom: 13 })
    this.register(BlockId.FURNACE, { top: 29, side: 30, bottom: 3 })
    this.register(BlockId.CHEST, { top: 40, side: 41, bottom: 13 })
    this.register(BlockId.TORCH, { top: 31, side: 31, bottom: 31 })
    this.register(BlockId.GLOWSTONE, { top: 32, side: 32, bottom: 32 })
    this.register(BlockId.FLOWER_RED, { top: 33, side: 33, bottom: 33 })
    this.register(BlockId.FLOWER_YELLOW, { top: 34, side: 34, bottom: 34 })
    this.register(BlockId.TALL_GRASS, { top: 35, side: 35, bottom: 35 })
    this.register(BlockId.CACTUS, { top: 36, side: 36, bottom: 36 })
    this.register(BlockId.BOOKSHELF, { top: 13, side: 37, bottom: 13 })
    this.register(BlockId.BED, { top: 38, side: 39, bottom: 13 })
    this.register(BlockId.WHEAT, { top: 100, side: 100, bottom: 100 })
  }

  private pixelNoiseAt(c: CanvasRenderingContext2D, _seed: number, density: number, color: [number, number, number]) {
    const count = this.tile * this.tile * density
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * this.tile)
      const y = Math.floor(Math.random() * this.tile)
      c.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`
      c.fillRect(x, y, 1, 1)
    }
  }

  register(id: BlockId, t: BlockTexture) {
    this.textures.set(id, t)
  }

  /** 获取图集中 0-1 UV 矩形（4 个值：u0, v0, u1, v1） */
  getUV(index: number, out?: number[]): [number, number, number, number] {
    const u0 = (index % this.size) / this.size
    const v0 = Math.floor(index / this.size) / this.size
    return [u0, v0, u0 + 1 / this.size, v0 + 1 / this.size]
  }
}

function mulberry(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
