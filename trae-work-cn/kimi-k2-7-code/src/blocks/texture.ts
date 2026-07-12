import { Texture, NearestFilter, SRGBColorSpace } from 'three'

export const TEXTURE_SIZE = 16

export interface TextureLayers {
  top?: HTMLCanvasElement
  bottom?: HTMLCanvasElement
  side?: HTMLCanvasElement
  all?: HTMLCanvasElement
}

function createCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

function drawBorder(
  ctx: CanvasRenderingContext2D,
  size: number,
  color: string,
  width = 1,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.strokeRect(0, 0, size, size)
}

function addNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  amount: number,
  color: string,
): void {
  ctx.fillStyle = color
  for (let i = 0; i < amount; i++) {
    const x = Math.floor(Math.random() * size)
    const y = Math.floor(Math.random() * size)
    ctx.fillRect(x, y, 1, 1)
  }
}

function makeTexture(canvas: HTMLCanvasElement): Texture {
  const texture = new Texture(canvas)
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function makeBlockTexture(
  baseColor: string,
  detailColor: string,
  borderColor: string,
): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  addNoise(ctx, TEXTURE_SIZE, 24, detailColor)
  drawBorder(ctx, TEXTURE_SIZE, borderColor)
  return canvas
}

export function makeGrassTopTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#5b8c38'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  addNoise(ctx, TEXTURE_SIZE, 16, '#6aa348')
  addNoise(ctx, TEXTURE_SIZE, 8, '#4d7630')
  drawBorder(ctx, TEXTURE_SIZE, '#4d7630')
  return canvas
}

export function makeGrassSideTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7a5a3a'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.fillStyle = '#5b8c38'
  ctx.fillRect(0, 0, TEXTURE_SIZE, 4)
  addNoise(ctx, TEXTURE_SIZE, 20, '#8f6e4d')
  drawBorder(ctx, TEXTURE_SIZE, '#5c4a35')
  return canvas
}

export function makeWoodSideTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#6b4f32'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.strokeStyle = '#4f3822'
  ctx.lineWidth = 1
  for (let y = 1; y < TEXTURE_SIZE; y += 4) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(TEXTURE_SIZE, y)
    ctx.stroke()
  }
  addNoise(ctx, TEXTURE_SIZE, 10, '#8a6a4a')
  drawBorder(ctx, TEXTURE_SIZE, '#4f3822')
  return canvas
}

export function makeWoodTopTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7a5d3e'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.strokeStyle = '#5c4328'
  ctx.beginPath()
  ctx.arc(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2, 5, 0, Math.PI * 2)
  ctx.stroke()
  addNoise(ctx, TEXTURE_SIZE, 16, '#9a7a5a')
  drawBorder(ctx, TEXTURE_SIZE, '#5c4328')
  return canvas
}

export function makeLeavesTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3a7a3a'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  addNoise(ctx, TEXTURE_SIZE, 32, '#4d9a4d')
  addNoise(ctx, TEXTURE_SIZE, 16, '#2e5e2e')
  drawBorder(ctx, TEXTURE_SIZE, '#2e5e2e')
  return canvas
}

export function makeWaterTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#3b78a8'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  addNoise(ctx, TEXTURE_SIZE, 12, '#5a9fd4')
  drawBorder(ctx, TEXTURE_SIZE, '#2e618a', 1)
  return canvas
}

export function makeGlassTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#aaddff'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(2, 2, TEXTURE_SIZE - 4, TEXTURE_SIZE - 4)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(3, 3, 2, 2)
  ctx.fillRect(TEXTURE_SIZE - 5, TEXTURE_SIZE - 5, 2, 2)
  return canvas
}

export function makeBrickTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#a05040'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.strokeStyle = '#7a3a2e'
  ctx.lineWidth = 1
  ctx.strokeRect(0, 0, TEXTURE_SIZE, 7)
  ctx.strokeRect(0, 7, 7, 5)
  ctx.strokeRect(7, 7, 9, 5)
  ctx.strokeRect(0, 12, TEXTURE_SIZE, 4)
  addNoise(ctx, TEXTURE_SIZE, 8, '#c06a58')
  drawBorder(ctx, TEXTURE_SIZE, '#7a3a2e')
  return canvas
}

export function makeDiamondOreTexture(): HTMLCanvasElement {
  const canvas = createCanvas(TEXTURE_SIZE)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7a7a7a'
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
  ctx.fillStyle = '#00ffff'
  ctx.fillRect(4, 4, 3, 3)
  ctx.fillRect(10, 9, 2, 2)
  ctx.fillRect(6, 11, 2, 2)
  addNoise(ctx, TEXTURE_SIZE, 16, '#999999')
  drawBorder(ctx, TEXTURE_SIZE, '#5a5a5a')
  return canvas
}

export function canvasToTexture(canvas: HTMLCanvasElement): Texture {
  return makeTexture(canvas)
}
