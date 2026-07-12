import * as THREE from 'three'

// 昼夜循环系统
// 维护一天中的时刻（0-1），驱动太阳/月亮位置、光照强度、天空颜色
// time: 0=午夜，0.25=日出，0.5=正午，0.75=日落
export class SkyCycle {
  constructor(scene, store, sunLight, ambientLight) {
    this.scene = scene
    this.store = store
    this.sunLight = sunLight
    this.ambientLight = ambientLight

    // 当前时刻（0-1）
    this.time = store.timeOfDay
    // 一个完整昼夜的秒数（10 分钟）
    this.dayLength = 600

    // 太阳与月亮的视觉表现
    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffff88 })
    )
    this.sun.frustumCulled = false
    this.scene.add(this.sun)

    this.moon = new THREE.Mesh(
      new THREE.SphereGeometry(6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xdddddd })
    )
    this.moon.frustumCulled = false
    this.scene.add(this.moon)

    // 预创建颜色常量，避免每帧重复分配
    this._dayColor = new THREE.Color(0x87ceeb) // 白天天蓝
    this._nightColor = new THREE.Color(0x0a0a2a) // 夜晚深蓝
    this._sunsetColor = new THREE.Color(0xff7744) // 日落橙
    this._tmpColor = new THREE.Color()

    // 初始应用一次，保证构造后场景立即匹配当前时间
    this._apply(this.time)
  }

  // 推进时间并更新视觉表现
  update(delta) {
    if (this.store.paused) return

    this.time += delta / this.dayLength
    if (this.time >= 1) this.time -= 1
    this.store.setTimeOfDay(this.time)

    this._apply(this.time)
  }

  // 根据 time 计算并应用光照、天体位置、天空色
  _apply(time) {
    // time=0.25 日出（太阳在东方地平线），0.5 正午（顶部），0.75 日落（西方），0 午夜（底部）
    const sunAngle = (time - 0.25) * Math.PI * 2
    const sunY = Math.sin(sunAngle)
    const sunX = Math.cos(sunAngle)

    // 光照方向：太阳/月亮挂在远处
    this.sunLight.position.set(sunX * 200, sunY * 200, 100)
    // 太阳强度：夜晚为 0，正午 0.7
    this.sunLight.intensity = Math.max(0, sunY) * 0.7
    // 环境光：夜晚 0.15，正午 0.5
    this.ambientLight.intensity = 0.15 + Math.max(0, sunY) * 0.35

    // 太阳与月亮的可视 mesh（放在远处天空中）
    this.sun.position.set(sunX * 300, sunY * 300, 100)
    this.moon.position.set(-sunX * 300, -sunY * 300, 100)
    this.sun.visible = sunY > -0.1
    this.moon.visible = sunY < 0.1

    // 天空颜色：白天 / 日出日落过渡 / 夜晚
    const color = this._tmpColor
    if (sunY > 0.2) {
      // 白天
      color.copy(this._dayColor)
    } else if (sunY > -0.2) {
      // 日出/日落过渡：根据 sunY 在 night↔day 之间过渡，并在地平线附近混入橙色
      const t = (sunY + 0.2) / 0.4 // 0->1
      color.copy(this._nightColor).lerp(this._dayColor, t)
      const sunsetMix = 1 - Math.abs(sunY) / 0.2
      color.lerp(this._sunsetColor, sunsetMix * 0.5)
    } else {
      // 夜晚
      color.copy(this._nightColor)
    }
    this.scene.background = color
    // 若场景已有雾（其他模块设置），同步雾色保持氛围一致
    if (this.scene.fog) {
      this.scene.fog.color = color
      // 同步雾的近远平面到当前渲染距离，避免改设置后雾边界错位
      const rd = this.store.renderDistance
      this.scene.fog.near = (rd - 2) * 16
      this.scene.fog.far = rd * 16
    }
  }

  // 释放资源
  dispose() {
    this.scene.remove(this.sun)
    this.scene.remove(this.moon)
    this.sun.geometry.dispose()
    this.sun.material.dispose()
    this.moon.geometry.dispose()
    this.moon.material.dispose()
  }
}
