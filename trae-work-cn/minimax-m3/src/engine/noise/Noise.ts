import { createNoise2D, createNoise3D } from 'simplex-noise'

/** 简单种子化伪随机数（mulberry32） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 使用给定种子创建 2D 噪声（值域 [-1, 1]） */
export function makeNoise2D(seed: number, octaves: number = 1, lacunarity: number = 2, persistence: number = 0.5, frequency: number = 1): (x: number, z: number) => number {
  const layers: ((x: number, z: number) => number)[] = []
  for (let i = 0; i < octaves; i++) {
    const rng = mulberry32(seed + i * 1737)
    layers.push(createNoise2D(rng))
  }
  return (x: number, z: number) => {
    let amp = 1
    let freq = frequency
    let sum = 0
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += amp * layers[i](x * freq, z * freq)
      norm += amp
      amp *= persistence
      freq *= lacunarity
    }
    return sum / norm
  }
}

/** 使用给定种子创建 3D 噪声 */
export function makeNoise3D(seed: number): (x: number, y: number, z: number) => number {
  const rng = mulberry32(seed)
  return createNoise3D(rng)
}
