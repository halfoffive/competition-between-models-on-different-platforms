import * as THREE from 'three'

const SkyColors = {
  dawn: new THREE.Color(0xff7f50),
  day: new THREE.Color(0x87ceeb),
  dusk: new THREE.Color(0xff6347),
  night: new THREE.Color(0x0a0a20)
}

const AmbientIntensities = {
  dawn: 0.4,
  day: 0.6,
  dusk: 0.4,
  night: 0.1
}

const FogColors = {
  dawn: new THREE.Color(0xffa07a),
  day: new THREE.Color(0x87ceeb),
  dusk: new THREE.Color(0xff7f50),
  night: new THREE.Color(0x050510)
}

const FogDensities = {
  dawn: { near: 40, far: 80 },
  day: { near: 40, far: 80 },
  dusk: { near: 30, far: 70 },
  night: { near: 15, far: 40 }
}

function lerpColor(a, b, t) {
  const color = new THREE.Color()
  color.r = a.r + (b.r - a.r) * t
  color.g = a.g + (b.g - a.g) * t
  color.b = a.b + (b.b - a.b) * t
  return color
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

export class DayNightCycle {
  constructor(options = {}) {
    this.dayTime = options.startTime || 0.25
    this.dayLength = options.dayLength || 600
    this.timeSpeed = options.timeSpeed || 1
    this.sunDistance = options.sunDistance || 100
  }

  update(delta) {
    this.dayTime += (delta / this.dayLength) * this.timeSpeed
    this.dayTime = this.dayTime % 1
    if (this.dayTime < 0) this.dayTime += 1
  }

  getSunPosition() {
    const angle = this.dayTime * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * this.sunDistance
    const y = Math.sin(angle) * this.sunDistance
    const z = 0
    return new THREE.Vector3(x, y, z)
  }

  getMoonPosition() {
    const pos = this.getSunPosition()
    pos.negate()
    return pos
  }

  getSkyColor() {
    return this._interpolatePhase(SkyColors)
  }

  getAmbientIntensity() {
    return this._interpolatePhaseValue(AmbientIntensities)
  }

  getFogColor() {
    return this._interpolatePhase(FogColors)
  }

  getFogDensity() {
    return this._interpolatePhaseFog(FogDensities)
  }

  getTimeOfDayName() {
    const t = this.dayTime
    if (t >= 0.15 && t < 0.35) return '白天'
    if (t >= 0.35 && t < 0.45) return '黄昏'
    if (t >= 0.45 && t < 0.55) return '夜晚'
    if (t >= 0.55 && t < 0.85) return '夜晚'
    if (t >= 0.85 || t < 0.15) return '黎明'
    return '白天'
  }

  _getPhaseAndT() {
    const t = this.dayTime
    if (t < 0.25) {
      return { from: 'dawn', to: 'day', t: t / 0.25 }
    } else if (t < 0.5) {
      return { from: 'day', to: 'dusk', t: (t - 0.25) / 0.25 }
    } else if (t < 0.75) {
      return { from: 'dusk', to: 'night', t: (t - 0.5) / 0.25 }
    } else {
      return { from: 'night', to: 'dawn', t: (t - 0.75) / 0.25 }
    }
  }

  _interpolatePhase(colorMap) {
    const { from, to, t } = this._getPhaseAndT()
    return lerpColor(colorMap[from], colorMap[to], t)
  }

  _interpolatePhaseValue(valueMap) {
    const { from, to, t } = this._getPhaseAndT()
    return lerp(valueMap[from], valueMap[to], t)
  }

  _interpolatePhaseFog(fogMap) {
    const { from, to, t } = this._getPhaseAndT()
    return {
      near: lerp(fogMap[from].near, fogMap[to].near, t),
      far: lerp(fogMap[from].far, fogMap[to].far, t)
    }
  }

  setTimeSpeed(speed) {
    this.timeSpeed = speed
  }

  setTime(time) {
    this.dayTime = time % 1
    if (this.dayTime < 0) this.dayTime += 1
  }
}
