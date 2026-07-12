// 简化版噪声生成器 - 使用多层正弦波叠加模拟 Perlin-like 噪声

export class NoiseGenerator {
  /**
   * @param {number} seed - 随机种子
   */
  constructor(seed = Math.random() * 10000) {
    this.seed = seed
    // 预计算偏移量，增加随机性
    this.offsetX = Math.sin(seed) * 10000
    this.offsetZ = Math.cos(seed) * 10000
  }

  /**
   * 2D 噪声，返回 -1 到 1 之间的值
   * 使用多层正弦波叠加（类似值噪声）
   * @param {number} x
   * @param {number} z
   * @returns {number} -1 到 1
   */
  noise2D(x, z) {
    const ox = this.offsetX
    const oz = this.offsetZ

    let value = 0
    let amplitude = 1.0
    let frequency = 1.0
    let maxValue = 0

    // 4 个八度叠加
    for (let i = 0; i < 4; i++) {
      const nx = x * frequency + ox * (i + 1)
      const nz = z * frequency + oz * (i + 1)

      // 使用正弦组合产生伪随机值
      value += amplitude * (
        Math.sin(nx * 1.3 + nz * 0.7) * Math.cos(nz * 1.1 - nx * 0.6) +
        Math.sin(nx * 0.8 - nz * 1.4) * 0.5 +
        Math.cos(nx * 1.7 + nz * 1.2) * 0.3
      ) / 1.8

      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2.0
    }

    return value / maxValue
  }
}