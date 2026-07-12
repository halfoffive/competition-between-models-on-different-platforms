import * as THREE from 'three'
import { World } from './World.js'
import { PlayerController } from './PlayerController.js'
import { SkyCycle } from './SkyCycle.js'
import { Storage } from './Storage.js'

// Three.js 引擎主类
// 负责场景、相机、渲染器、灯光的初始化与渲染循环
// 后续模块会往 scene 中添加内容（地形、玩家、方块等）
export class Game {
  constructor(canvas, store) {
    this.canvas = canvas
    this.store = store
    this.world = null // 体素世界实例
    this.player = null // 玩家控制器实例
    this.sky = null // 昼夜循环实例
    this.storage = new Storage() // 存档/读档
    this.running = false // 游戏是否运行中

    // 场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // 天蓝色

    // 透视相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, 70, 0)

    // WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.domElement = this.renderer.domElement // 画布元素，供 PlayerController 绑定事件

    // 环境光（强度 0.6）—— 保存引用供 SkyCycle 调整
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(this.ambientLight)

    // 平行光（强度 0.8，位置 100,200,100）—— 保存引用供 SkyCycle 调整
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.sunLight.position.set(100, 200, 100)
    this.scene.add(this.sunLight)

    // 时钟，用于计算 delta
    this.clock = new THREE.Clock()

    // FPS 统计相关
    this._fpsAccum = 0 // 累积帧数
    this._fpsTimer = 0 // 累积时间（秒）

    // 动画帧 id
    this._rafId = null
    this._disposed = false
  }

  // 启动渲染循环
  start() {
    this._loop = this._loop.bind(this)
    this._rafId = requestAnimationFrame(this._loop)
  }

  // 开始游戏：创建世界并加载初始区块
  startGame(seed) {
    // 添加雾效，隐藏远处区块加载边界
    // near = (renderDistance-2)*16，far = renderDistance*16
    const rd = this.store.renderDistance
    this.scene.fog = new THREE.Fog(0x87ceeb, (rd - 2) * 16, rd * 16)

    this.world = new World(this.scene, this.store)
    this.world.init(seed)
    // 创建第一人称玩家控制器（world 初始化后，出生点调整可读取地形）
    this.player = new PlayerController(this.camera, this.domElement, this.world, this.store)
    // 相机定位到玩家初始位置（首帧由 player.update 校正）
    const p = this.store.playerPos
    this.camera.position.set(p.x, p.y, p.z)
    // 创建昼夜循环（基于当前 store.timeOfDay）
    this.sky = new SkyCycle(this.scene, this.store, this.sunLight, this.ambientLight)
    this.running = true
    this.store.setRunning(true)
  }

  // 保存世界与玩家状态到 localStorage
  // 返回 true 表示成功
  saveGame() {
    if (!this.world || !this.player) return false
    return this.storage.save(this.world, this.player, this.store)
  }

  // 读取存档：若存在则恢复，否则以当前种子新开世界
  loadGame() {
    const data = this.storage.load()
    if (!data) {
      this.startGame(this.store.worldSeed)
      return
    }
    this.startGame(data.seed)
    this.storage.applyLoadedData(data, this.world, this.player, this.store)
    // 应用存档后同步相机位置（玩家位置已被覆盖）
    const pp = this.player.position
    this.camera.position.set(pp.x, pp.y + this.player.eyeHeight, pp.z)
    this.camera.rotation.set(this.player.pitch, this.player.yaw, 0, 'YXZ')
  }

  // 停止当前游戏会话（返回主菜单用）：释放世界与玩家，但保留渲染器/场景/循环
  // 不调用 renderer.dispose，因为同一 canvas 无法重建 WebGL 上下文
  stopGame() {
    if (this.sky) {
      this.sky.dispose()
      this.sky = null
    }
    if (this.player) {
      this.player.dispose()
      this.player = null
    }
    if (this.world) {
      this.world.dispose()
      this.world = null
    }
    this.running = false
    this.store.setRunning(false)
    this.store.setScreen('menu')
  }

  // 渲染循环
  _loop() {
    if (this._disposed) return
    this._rafId = requestAnimationFrame(this._loop)

    const delta = this.clock.getDelta()

    // 每帧更新逻辑
    this.update(delta)

    // 渲染
    this.renderer.render(this.scene, this.camera)

    // FPS 计算：每秒更新一次 store
    this._fpsAccum++
    this._fpsTimer += delta
    if (this._fpsTimer >= 1) {
      this.store.setFps(this._fpsAccum)
      this._fpsAccum = 0
      this._fpsTimer = 0
    }
  }

  // 每帧更新逻辑
  update(delta) {
    // 游戏运行中且未暂停时更新玩家与世界
    if (this.world && this.running && !this.store.paused) {
      // 先更新玩家（更新相机位置），再以相机位置加载区块
      if (this.player) this.player.update(delta)
      this.world.update(this.camera.position.x, this.camera.position.z)
      // 昼夜循环推进（放在世界更新之后，避免与区块加载争抢帧时间）
      if (this.sky) this.sky.update(delta)
    }
  }

  // 处理窗口大小变化
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  // 释放资源
  dispose() {
    this._disposed = true
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
    // 释放昼夜循环（太阳/月亮 mesh 与材质）
    if (this.sky) {
      this.sky.dispose()
      this.sky = null
    }
    // 释放玩家控制器（移除事件监听与高亮）
    if (this.player) {
      this.player.dispose()
      this.player = null
    }
    // 释放体素世界
    if (this.world) {
      this.world.dispose()
      this.world = null
    }
    // 释放场景中的几何体与材质
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose())
        } else {
          obj.material.dispose()
        }
      }
    })
    this.renderer.dispose()
  }
}
