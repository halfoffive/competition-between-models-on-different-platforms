import * as THREE from 'three'
import { BLOCKS } from './blocks.js'

// 程序化纹理图集模块
// 用 Canvas 2D 生成像素风格方块纹理图集
// 图集布局：16 列 x 2 行，每 tile 16x16 像素，总尺寸 256x32

const TILE_SIZE = 16
const COLS = 16
const ROWS = 2
const ATLAS_W = COLS * TILE_SIZE // 256
const ATLAS_H = ROWS * TILE_SIZE // 32

// 模块级缓存：图集 canvas 与方块图标 dataURL
let _atlasCanvas = null
const _iconCache = new Map()

// 将十六进制颜色 #rrggbb 转为 [r,g,b]
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// 将 rgb 数组转为 rgba 字符串
function rgbStr(rgb, a = 1) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`
}

// 数值在范围内线性映射
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// 绘制带噪点变化的 tile
// baseColor: '#rrggbb'，variation: 像素亮度浮动幅度（0-40）
function drawNoise(ctx, x0, y0, baseColor, variation = 18) {
  const base = hexToRgb(baseColor)
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      // 基于像素位置的确定性伪随机
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * variation
      const r = clamp(base[0] + d, 0, 255) | 0
      const g = clamp(base[1] + d, 0, 255) | 0
      const b = clamp(base[2] + d, 0, 255) | 0
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}

// 草侧：上半部分草绿，下半部分泥土棕
function drawGrassSide(ctx, x0, y0) {
  // 下半泥土
  const dirt = hexToRgb('#8b6240')
  for (let y = 8; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * 16
      ctx.fillStyle = `rgb(${clamp(dirt[0] + d, 0, 255) | 0},${clamp(dirt[1] + d, 0, 255) | 0},${clamp(dirt[2] + d, 0, 255) | 0})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
  // 上半草绿
  const grass = hexToRgb('#5fb24a')
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * 18
      ctx.fillStyle = `rgb(${clamp(grass[0] + d, 0, 255) | 0},${clamp(grass[1] + d, 0, 255) | 0},${clamp(grass[2] + d, 0, 255) | 0})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
  // 过渡带：第 7-8 行混杂
  for (let x = 0; x < TILE_SIZE; x++) {
    if ((((x * 127) ^ 13) & 7) < 3) {
      ctx.fillStyle = rgbStr(grass)
      ctx.fillRect(x0 + x, y0 + 7, 1, 1)
    }
  }
}

// 木头顶：年轮纹
function drawLogTop(ctx, x0, y0) {
  const base = hexToRgb('#b08a4a')
  const dark = hexToRgb('#8a6a32')
  // 填充底色
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      ctx.fillStyle = rgbStr(base)
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
  // 年轮圆环
  const cx = 7.5, cy = 7.5
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (Math.floor(dist) % 3 === 0) {
        ctx.fillStyle = rgbStr(dark)
        ctx.fillRect(x0 + x, y0 + y, 1, 1)
      }
    }
  }
  // 中心深点
  ctx.fillStyle = rgbStr(hexToRgb('#6a4a22'))
  ctx.fillRect(x0 + 7, y0 + 7, 2, 2)
}

// 木头侧：树皮竖纹
function drawLogSide(ctx, x0, y0) {
  const base = hexToRgb('#6b4a2a')
  const dark = hexToRgb('#4a3320')
  const light = hexToRgb('#7f5a36')
  for (let x = 0; x < TILE_SIZE; x++) {
    // 竖纹：每列亮度不同
    const colPattern = (x * 374761393) & 0xffff
    const colVar = (colPattern / 0xffff) * 2 - 1
    for (let y = 0; y < TILE_SIZE; y++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * 8
      let c = base
      if (colVar > 0.4) c = light
      else if (colVar < -0.4) c = dark
      ctx.fillStyle = `rgb(${clamp(c[0] + d, 0, 255) | 0},${clamp(c[1] + d, 0, 255) | 0},${clamp(c[2] + d, 0, 255) | 0})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}

// 树叶：深绿带镂空感
function drawLeaves(ctx, x0, y0) {
  const base = hexToRgb('#2f7a2f')
  const dark = hexToRgb('#1f5a1f')
  const light = hexToRgb('#3f9a3f')
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const r = n / 0xffff
      let c = base
      if (r > 0.8) c = light
      else if (r < 0.25) c = dark
      ctx.fillStyle = rgbStr(c)
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}

// 水：蓝色带波纹
function drawWater(ctx, x0, y0) {
  const base = hexToRgb('#3a6ed8')
  const light = hexToRgb('#5a8ef0')
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      // 波纹：基于 sin
      const wave = Math.sin((x + y) * 0.8) * 0.5 + 0.5
      let c = base
      if (wave > 0.7) c = light
      ctx.fillStyle = rgbStr(c)
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}

// 矿石：石头底 + 矿斑
function drawOre(ctx, x0, y0, spotColor) {
  // 石头底
  drawNoise(ctx, x0, y0, '#888888', 14)
  // 矿斑：随机位置画小块
  const spots = [
    [3, 3], [4, 3], [9, 4], [10, 4], [4, 9], [3, 10], [10, 9], [11, 10], [7, 7], [6, 12], [12, 12]
  ]
  ctx.fillStyle = spotColor
  for (const [sx, sy] of spots) {
    ctx.fillRect(x0 + sx, y0 + sy, 2, 2)
  }
  // 矿斑高光
  ctx.fillStyle = rgbStr(hexToRgb('#ffffff'), 0.3)
  for (const [sx, sy] of spots) {
    ctx.fillRect(x0 + sx, y0 + sy, 1, 1)
  }
}

// 木板：横纹
function drawPlanks(ctx, x0, y0) {
  const base = hexToRgb('#c99a5a')
  const dark = hexToRgb('#a87a3a')
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * 10
      ctx.fillStyle = `rgb(${clamp(base[0] + d, 0, 255) | 0},${clamp(base[1] + d, 0, 255) | 0},${clamp(base[2] + d, 0, 255) | 0})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
  // 横向分隔线（每 4 像素一条）
  ctx.fillStyle = rgbStr(dark)
  for (let y = 3; y < TILE_SIZE; y += 4) {
    ctx.fillRect(x0, y0 + y, TILE_SIZE, 1)
  }
  // 竖向接缝（错位）
  ctx.fillRect(x0 + 7, y0, 1, 4)
  ctx.fillRect(x0 + 3, y0 + 4, 1, 4)
  ctx.fillRect(x0 + 11, y0 + 4, 1, 4)
  ctx.fillRect(x0 + 7, y0 + 8, 1, 4)
  ctx.fillRect(x0 + 3, y0 + 12, 1, 4)
  ctx.fillRect(x0 + 11, y0 + 12, 1, 4)
}

// 圆石：碎石不规则灰块
function drawCobblestone(ctx, x0, y0) {
  // 底色
  drawNoise(ctx, x0, y0, '#666666', 8)
  // 不规则块
  const blocks = [
    [0, 0, 5, 4, '#888888'],
    [6, 0, 5, 3, '#777777'],
    [12, 0, 4, 5, '#999999'],
    [0, 5, 4, 4, '#7a7a7a'],
    [5, 4, 4, 5, '#888888'],
    [10, 6, 6, 4, '#707070'],
    [0, 10, 6, 6, '#888888'],
    [7, 10, 5, 6, '#777777'],
    [13, 11, 3, 5, '#999999']
  ]
  for (const [bx, by, bw, bh, col] of blocks) {
    const c = hexToRgb(col)
    for (let y = 0; y < bh; y++) {
      for (let x = 0; x < bw; x++) {
        const px = bx + x, py = by + y
        if (px < TILE_SIZE && py < TILE_SIZE) {
          const n = ((px * 374761393) ^ (py * 668265263)) & 0xffff
          const d = ((n / 0xffff) * 2 - 1) * 12
          ctx.fillStyle = `rgb(${clamp(c[0] + d, 0, 255) | 0},${clamp(c[1] + d, 0, 255) | 0},${clamp(c[2] + d, 0, 255) | 0})`
          ctx.fillRect(x0 + px, y0 + py, 1, 1)
        }
      }
    }
  }
  // 块之间的深色缝隙
  ctx.fillStyle = rgbStr(hexToRgb('#444444'))
  ctx.fillRect(x0 + 5, y0, 1, TILE_SIZE)
  ctx.fillRect(x0 + 11, y0, 1, TILE_SIZE)
  ctx.fillRect(x0, y0 + 4, TILE_SIZE, 1)
  ctx.fillRect(x0, y0 + 9, TILE_SIZE, 1)
}

// 玻璃：浅蓝边框 + 半透明中心
function drawGlass(ctx, x0, y0) {
  // 透明背景（清空）
  ctx.clearRect(x0, y0, TILE_SIZE, TILE_SIZE)
  // 半透明中心
  ctx.fillStyle = 'rgba(180,220,240,0.25)'
  ctx.fillRect(x0, y0, TILE_SIZE, TILE_SIZE)
  // 浅蓝边框
  ctx.fillStyle = '#a0d8f0'
  ctx.fillRect(x0, y0, TILE_SIZE, 1)
  ctx.fillRect(x0, y0 + TILE_SIZE - 1, TILE_SIZE, 1)
  ctx.fillRect(x0, y0, 1, TILE_SIZE)
  ctx.fillRect(x0 + TILE_SIZE - 1, y0, 1, TILE_SIZE)
  // 高光斜线
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillRect(x0 + 2, y0 + 2, 3, 1)
  ctx.fillRect(x0 + 2, y0 + 3, 2, 1)
  ctx.fillRect(x0 + 2, y0 + 4, 1, 1)
}

// 基岩：深灰带黑斑
function drawBedrock(ctx, x0, y0) {
  const base = hexToRgb('#444444')
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const r = n / 0xffff
      let c = base
      if (r > 0.75) c = hexToRgb('#222222')
      else if (r < 0.2) c = hexToRgb('#666666')
      ctx.fillStyle = rgbStr(c)
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
}

// 仙人掌：绿
function drawCactus(ctx, x0, y0) {
  const base = hexToRgb('#4a7a3a')
  const dark = hexToRgb('#3a6a2a')
  for (let y = 0; y < TILE_SIZE; y++) {
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = ((x * 374761393) ^ (y * 668265263)) & 0xffff
      const d = ((n / 0xffff) * 2 - 1) * 10
      ctx.fillStyle = `rgb(${clamp(base[0] + d, 0, 255) | 0},${clamp(base[1] + d, 0, 255) | 0},${clamp(base[2] + d, 0, 255) | 0})`
      ctx.fillRect(x0 + x, y0 + y, 1, 1)
    }
  }
  // 竖纹凸起
  ctx.fillStyle = rgbStr(dark)
  ctx.fillRect(x0 + 4, y0, 1, TILE_SIZE)
  ctx.fillRect(x0 + 11, y0, 1, TILE_SIZE)
  // 顶部刺
  ctx.fillStyle = '#dff0a0'
  ctx.fillRect(x0 + 4, y0, 1, 1)
  ctx.fillRect(x0 + 11, y0, 1, 1)
}

// 工作台顶：网格线木板
function drawCraftingTableTop(ctx, x0, y0) {
  // 木板底
  drawPlanks(ctx, x0, y0)
  // 网格线
  ctx.fillStyle = '#3a2a10'
  ctx.fillRect(x0, y0, TILE_SIZE, 1)
  ctx.fillRect(x0, y0 + 7, TILE_SIZE, 1)
  ctx.fillRect(x0, y0 + 15, TILE_SIZE, 1)
  ctx.fillRect(x0, y0, 1, TILE_SIZE)
  ctx.fillRect(x0 + 7, y0, 1, TILE_SIZE)
  ctx.fillRect(x0 + 15, y0, 1, TILE_SIZE)
  // 中心十字
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(x0 + 6, y0 + 6, 4, 4)
  ctx.fillStyle = '#8a6a3a'
  ctx.fillRect(x0 + 7, y0 + 7, 2, 2)
}

// 工作台侧：木板 + 工具纹
function drawCraftingTableSide(ctx, x0, y0) {
  // 木板底
  drawPlanks(ctx, x0, y0)
  // 顶部一条深色
  ctx.fillStyle = '#5a3a1a'
  ctx.fillRect(x0, y0, TILE_SIZE, 2)
  // 工具图案：锯子轮廓
  ctx.fillStyle = '#3a2a10'
  // 十字交叉
  ctx.fillRect(x0 + 3, y0 + 6, 10, 1)
  ctx.fillRect(x0 + 7, y0 + 4, 1, 6)
  // 角落螺丝
  ctx.fillStyle = '#888888'
  ctx.fillRect(x0 + 2, y0 + 3, 1, 1)
  ctx.fillRect(x0 + 13, y0 + 3, 1, 1)
  ctx.fillRect(x0 + 2, y0 + 12, 1, 1)
  ctx.fillRect(x0 + 13, y0 + 12, 1, 1)
}

// 熔炉：石头 + 中间黑色火口
function drawFurnace(ctx, x0, y0) {
  // 石头底
  drawNoise(ctx, x0, y0, '#888888', 14)
  // 中间火口（黑色洞）
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(x0 + 4, y0 + 5, 8, 7)
  // 火口边框（圆石色）
  ctx.fillStyle = '#555555'
  ctx.fillRect(x0 + 4, y0 + 4, 8, 1)
  ctx.fillRect(x0 + 4, y0 + 12, 8, 1)
  ctx.fillRect(x0 + 3, y0 + 5, 1, 7)
  ctx.fillRect(x0 + 12, y0 + 5, 1, 7)
  // 顶部一条横纹（熔炉口）
  ctx.fillStyle = '#666666'
  ctx.fillRect(x0, y0, TILE_SIZE, 2)
}

// 获取（必要时创建并缓存）图集 canvas
// 供 createTextureAtlas 与 getBlockIconDataURL 共用，避免重复绘制
export function getAtlasCanvas() {
  if (_atlasCanvas) return _atlasCanvas
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_W
  canvas.height = ATLAS_H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

  // 清空
  ctx.clearRect(0, 0, ATLAS_W, ATLAS_H)

  // 按索引绘制每个 tile
  const drawers = [
    (ctx, x, y) => drawNoise(ctx, x, y, '#5fb24a', 18),   // 0 草顶
    drawGrassSide,                                          // 1 草侧
    (ctx, x, y) => drawNoise(ctx, x, y, '#8b6240', 16),   // 2 泥土
    (ctx, x, y) => drawNoise(ctx, x, y, '#888888', 14),   // 3 石头
    (ctx, x, y) => drawNoise(ctx, x, y, '#e6d8a8', 12),   // 4 沙子
    drawLogTop,                                             // 5 木头顶
    drawLogSide,                                            // 6 木头侧
    drawLeaves,                                             // 7 树叶
    drawWater,                                              // 8 水
    (ctx, x, y) => drawOre(ctx, x, y, '#1a1a1a'),          // 9 煤矿
    (ctx, x, y) => drawOre(ctx, x, y, '#c87838'),          // 10 铁矿
    drawPlanks,                                             // 11 木板
    drawCobblestone,                                        // 12 圆石
    drawGlass,                                              // 13 玻璃
    drawBedrock,                                            // 14 基岩
    drawCactus,                                             // 15 仙人掌
    drawCraftingTableTop,                                   // 16 工作台顶
    drawCraftingTableSide,                                  // 17 工作台侧
    drawFurnace                                             // 18 熔炉
  ]

  for (let i = 0; i < drawers.length; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x0 = col * TILE_SIZE
    const y0 = row * TILE_SIZE
    drawers[i](ctx, x0, y0)
  }

  _atlasCanvas = canvas
  return canvas
}

// 主函数：创建纹理图集（返回 THREE.CanvasTexture，保持与 World.js 用法兼容）
export function createTextureAtlas() {
  const canvas = getAtlasCanvas()
  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

// 获取指定方块的 side tile 图标 dataURL（48x48，放大 3 倍，pixelated）
// 结果缓存避免重复绘制。用于 HUD/物品栏图标。
export function getBlockIconDataURL(blockId) {
  if (_iconCache.has(blockId)) return _iconCache.get(blockId)
  const block = BLOCKS[blockId]
  if (!block) return ''
  const tileIndex = block.tiles.side
  const atlas = getAtlasCanvas()
  const col = tileIndex % COLS
  const row = Math.floor(tileIndex / COLS)
  const sx = col * TILE_SIZE
  const sy = row * TILE_SIZE

  const ICON_SIZE = 48
  const out = document.createElement('canvas')
  out.width = ICON_SIZE
  out.height = ICON_SIZE
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE)
  ctx.drawImage(atlas, sx, sy, TILE_SIZE, TILE_SIZE, 0, 0, ICON_SIZE, ICON_SIZE)

  const url = out.toDataURL()
  _iconCache.set(blockId, url)
  return url
}
