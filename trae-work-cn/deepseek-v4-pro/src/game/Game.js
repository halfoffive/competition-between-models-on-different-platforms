import * as THREE from 'three'
import { ChunkManager } from './ChunkManager.js'
import { PlayerController } from './PlayerController.js'
import { BlockInteraction } from './BlockInteraction.js'

export class Game {
  constructor(canvas) {
    // 创建场景
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // 天空蓝
    this.scene.fog = new THREE.Fog(0x87ceeb, 50, 200)
    
    // 创建摄像机
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500)
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    
    // 光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 200, 50)
    this.scene.add(directionalLight)
    
    // 初始化系统
    this.chunkManager = new ChunkManager(this.scene)
    this.player = new PlayerController(this.camera, canvas, this.chunkManager)
    this.interaction = new BlockInteraction(this.camera, this.chunkManager, this.scene)
    
    // 窗口缩放
    window.addEventListener('resize', this.onResize.bind(this))
    
    // 游戏循环
    this.clock = new THREE.Clock()
    this.running = false
  }
  
  start() {
    this.player.init()
    this.running = true
    
    // 设置方块选择回调
    this.player.onBlockSelect = (delta) => {
      // 滚轮切换方块 - 通知外部 Vue 组件
      if (this.onHotbarChange) this.onHotbarChange(delta)
    }
    this.player.onDigitSelect = (index) => {
      if (this.onHotbarSelect) this.onHotbarSelect(index)
    }
    
    // 鼠标事件处理
    this.setupMouseEvents()
    
    this.animate()
  }
  
  setupMouseEvents() {
    const canvas = this.renderer.domElement
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // 左键 - 开始破坏方块（持续按住）
        this.isBreaking = true
      } else if (e.button === 2) {
        // 右键 - 放置方块
        this.interaction.placeBlock()
      }
    })
    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.isBreaking = false
      }
    })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }
  
  animate() {
    if (!this.running) return
    requestAnimationFrame(() => this.animate())
    
    const dt = Math.min(this.clock.getDelta(), 0.1)
    
    // 更新玩家
    this.player.update(dt)
    
    // 更新区块加载
    this.chunkManager.update(this.player.position.x, this.player.position.z, 6)
    
    // 更新方块交互
    this.interaction.update()
    
    // 左键按住破坏方块
    if (this.isBreaking) {
      this.interaction.breakBlock()
    }
    
    // 渲染
    this.renderer.render(this.scene, this.camera)
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  
  // 从外部设置方块类型
  setSelectedBlockType(type) {
    this.interaction.setBlockType(type)
  }
  
  dispose() {
    this.running = false
    this.player.dispose()
    this.interaction.dispose()
    this.renderer.dispose()
  }
}