import * as THREE from 'three'
import { BLOCK_TYPES, getBlockName } from './BlockTypes.js'

export class BlockInteraction {
  /**
   * @param {THREE.Camera} camera - 摄像机
   * @param {ChunkManager} chunkManager - 区块管理器
   * @param {THREE.Scene} scene - Three.js 场景
   */
  constructor(camera, chunkManager, scene) {
    this.camera = camera
    this.chunkManager = chunkManager
    this.scene = scene

    this.raycaster = new THREE.Raycaster()
    this.raycaster.far = 8 // 最大交互距离

    // 当前选中的方块类型
    this.selectedBlockType = BLOCK_TYPES.GRASS

    // 高亮线框
    this.highlightBox = null
    this._createHighlightBox()

    // 当前目标
    this.currentTarget = null
  }

  /**
   * 创建高亮线框
   */
  _createHighlightBox() {
    const geometry = new THREE.BoxGeometry(1.005, 1.005, 1.005)
    const edges = new THREE.EdgesGeometry(geometry)
    const material = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 1,
      transparent: true,
      opacity: 0.4,
      depthTest: true,
    })
    this.highlightBox = new THREE.LineSegments(edges, material)
    this.highlightBox.visible = false
    this.scene.add(this.highlightBox)
  }

  /**
   * 每帧更新射线检测
   * @returns {{ position: THREE.Vector3, normal: THREE.Vector3, blockPos: THREE.Vector3 } | null}
   */
  update() {
    // 从相机中心发射射线
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)

    // 收集场景中所有 chunk mesh 用于射线检测
    const meshes = []
    const chunks = this.chunkManager.getLoadedChunks()
    for (const chunk of chunks.values()) {
      if (chunk.meshGroup) {
        chunk.meshGroup.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child)
          }
        })
      }
    }

    const intersects = this.raycaster.intersectObjects(meshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0]

      // 计算被击中的方块坐标
      const point = hit.point.clone()
      const normal = hit.face.normal.clone()

      // 方块位置：从交点沿法线反方向偏移到方块中心
      const blockPos = new THREE.Vector3(
        Math.floor(point.x - normal.x * 0.5),
        Math.floor(point.y - normal.y * 0.5),
        Math.floor(point.z - normal.z * 0.5)
      )

      // 验证方块位置有效
      if (blockPos.y < 0 || blockPos.y >= 128) {
        this.highlightBox.visible = false
        this.currentTarget = null
        return null
      }

      const blockType = this.chunkManager.getBlock(
        blockPos.x, blockPos.y, blockPos.z
      )

      if (blockType === BLOCK_TYPES.AIR) {
        this.highlightBox.visible = false
        this.currentTarget = null
        return null
      }

      // 更新高亮框位置
      this.highlightBox.position.set(
        blockPos.x + 0.5,
        blockPos.y + 0.5,
        blockPos.z + 0.5
      )
      this.highlightBox.visible = true

      this.currentTarget = {
        position: point,
        normal: normal,
        blockPos: blockPos,
        blockType: blockType,
      }

      return this.currentTarget
    }

    this.highlightBox.visible = false
    this.currentTarget = null
    return null
  }

  /**
   * 获取当前瞄准的方块信息
   * @returns {{ position: THREE.Vector3, normal: THREE.Vector3, blockPos: THREE.Vector3, blockType: number } | null}
   */
  getTarget() {
    return this.currentTarget
  }

  /**
   * 破坏瞄准的方块
   */
  breakBlock() {
    if (!this.currentTarget) return

    const { blockPos } = this.currentTarget
    this.chunkManager.setBlock(
      blockPos.x, blockPos.y, blockPos.z,
      BLOCK_TYPES.AIR
    )
  }

  /**
   * 在瞄准方块相邻位置放置方块
   */
  placeBlock() {
    if (!this.currentTarget) return

    const { blockPos, normal } = this.currentTarget

    const placePos = new THREE.Vector3(
      blockPos.x + normal.x,
      blockPos.y + normal.y,
      blockPos.z + normal.z
    )

    // 检查放置位置是否有效
    if (placePos.y < 0 || placePos.y >= 128) return

    // 检查目标位置是否已被占据
    const existingBlock = this.chunkManager.getBlock(
      placePos.x, placePos.y, placePos.z
    )
    if (existingBlock !== BLOCK_TYPES.AIR) return

    // 检查放置位置是否与玩家重叠
    // 这个检查应该由 Game.js 处理，这里做简单检查
    this.chunkManager.setBlock(
      placePos.x, placePos.y, placePos.z,
      this.selectedBlockType
    )
  }

  /**
   * 设置当前选中的方块类型
   * @param {number} type
   */
  setBlockType(type) {
    if (type >= BLOCK_TYPES.GRASS && type <= BLOCK_TYPES.WATER) {
      this.selectedBlockType = type
    }
  }

  /**
   * 获取当前选中方块类型的名称
   * @returns {string}
   */
  getSelectedBlockName() {
    return getBlockName(this.selectedBlockType)
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.highlightBox) {
      this.scene.remove(this.highlightBox)
      if (this.highlightBox.geometry) {
        this.highlightBox.geometry.dispose()
      }
      if (this.highlightBox.material) {
        this.highlightBox.material.dispose()
      }
      this.highlightBox = null
    }
  }
}