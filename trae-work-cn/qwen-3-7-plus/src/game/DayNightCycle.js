import * as THREE from 'three'

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene
    
    // 时间系统（0-24小时）
    this.time = 8 // 从早上8点开始
    this.timeSpeed = 0.001 // 时间流逝速度
    
    // 光照
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    
    // 初始化光照
    this.directionalLight.position.set(50, 100, 50)
    this.directionalLight.castShadow = false
    
    scene.add(this.ambientLight)
    scene.add(this.directionalLight)
    
    // 天空颜色配置
    this.skyColors = {
      dawn: new THREE.Color(0xffa500),    // 黎明橙色
      day: new THREE.Color(0x87ceeb),     // 白天蓝色
      dusk: new THREE.Color(0xff6347),    // 黄昏红色
      night: new THREE.Color(0x0a0a2a)    // 夜晚深蓝
    }
  }
  
  update(deltaTime) {
    // 更新时间
    this.time += this.timeSpeed * deltaTime
    if (this.time >= 24) {
      this.time -= 24
    }
    
    // 更新天空颜色
    this.updateSkyColor()
    
    // 更新光照
    this.updateLighting()
  }
  
  updateSkyColor() {
    let skyColor
    
    if (this.time >= 5 && this.time < 7) {
      // 黎明 (5:00 - 7:00)
      const t = (this.time - 5) / 2
      skyColor = this.lerpColor(this.skyColors.night, this.skyColors.dawn, t)
    } else if (this.time >= 7 && this.time < 9) {
      // 早晨 (7:00 - 9:00)
      const t = (this.time - 7) / 2
      skyColor = this.lerpColor(this.skyColors.dawn, this.skyColors.day, t)
    } else if (this.time >= 9 && this.time < 17) {
      // 白天 (9:00 - 17:00)
      skyColor = this.skyColors.day
    } else if (this.time >= 17 && this.time < 19) {
      // 黄昏 (17:00 - 19:00)
      const t = (this.time - 17) / 2
      skyColor = this.lerpColor(this.skyColors.day, this.skyColors.dusk, t)
    } else if (this.time >= 19 && this.time < 21) {
      // 傍晚 (19:00 - 21:00)
      const t = (this.time - 19) / 2
      skyColor = this.lerpColor(this.skyColors.dusk, this.skyColors.night, t)
    } else {
      // 夜晚 (21:00 - 5:00)
      skyColor = this.skyColors.night
    }
    
    this.scene.background = skyColor
  }
  
  updateLighting() {
    // 根据时间调整光照强度
    let ambientIntensity
    let directionalIntensity
    
    if (this.time >= 6 && this.time < 18) {
      // 白天
      const dayProgress = Math.sin(((this.time - 6) / 12) * Math.PI)
      ambientIntensity = 0.4 + dayProgress * 0.3
      directionalIntensity = 0.6 + dayProgress * 0.4
    } else {
      // 夜晚
      ambientIntensity = 0.2
      directionalIntensity = 0.3
    }
    
    this.ambientLight.intensity = ambientIntensity
    this.directionalLight.intensity = directionalIntensity
    
    // 调整太阳光颜色
    if (this.time >= 5 && this.time < 7) {
      // 黎明 - 暖色调
      this.directionalLight.color.setHex(0xffaa88)
    } else if (this.time >= 17 && this.time < 19) {
      // 黄昏 - 暖色调
      this.directionalLight.color.setHex(0xff8866)
    } else {
      // 白天/夜晚 - 白色
      this.directionalLight.color.setHex(0xffffff)
    }
  }
  
  lerpColor(color1, color2, t) {
    const r = color1.r + (color2.r - color1.r) * t
    const g = color1.g + (color2.g - color1.g) * t
    const b = color1.b + (color2.b - color1.b) * t
    return new THREE.Color(r, g, b)
  }
  
  // 获取当前时间（用于调试）
  getTimeString() {
    const hours = Math.floor(this.time)
    const minutes = Math.floor((this.time - hours) * 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }
}
