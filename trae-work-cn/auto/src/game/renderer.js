import * as THREE from 'three'
import { BlockType, BlockData, generateBlockTexture } from './blocks.js'


function createFaceGeometry(faceIndex) {
  const geo = new THREE.PlaneGeometry(1, 1)
  geo.translate(0, 0, 0.5)
  switch (faceIndex) {
    case 0:
      geo.rotateY(Math.PI / 2)
      break
    case 1:
      geo.rotateY(-Math.PI / 2)
      break
    case 2:
      geo.rotateX(-Math.PI / 2)
      break
    case 3:
      geo.rotateX(Math.PI / 2)
      break
    case 4:
      break
    case 5:
      geo.rotateY(Math.PI)
      break
  }
  return geo
}

const faceNames = ['side', 'side', 'top', 'bottom', 'side', 'side']

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this._onResize = this._onResize.bind(this)
    this.instancedMeshes = new Map()
    this.faceIndexMap = new Map()
    this.blockHighlighter = null
    this._setupLighting()
    this._setupFog()
    this._setupHighlighter()
    this.maxInstances = 65536
  }

  _setupLighting() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(this.ambientLight)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8)
    this.sunLight.position.set(50, 100, 50)
    this.scene.add(this.sunLight)
    this.scene.background = new THREE.Color(0x87ceeb)
  }

  _setupFog() {
    this.scene.fog = new THREE.Fog(0x87ceeb, 40, 80)
  }

  setSkyColor(color) {
    this.scene.background = color
  }

  setAmbientIntensity(intensity) {
    if (this.ambientLight) {
      this.ambientLight.intensity = intensity
    }
  }

  setSunPosition(position) {
    if (this.sunLight) {
      this.sunLight.position.copy(position)
      this.sunLight.intensity = position.y > 0 ? 0.8 : 0.1
    }
  }

  setFog(color, density) {
    if (this.scene.fog) {
      this.scene.fog.color = color
      if (density) {
        this.scene.fog.near = density.near
        this.scene.fog.far = density.far
      }
    }
  }

  _setupHighlighter() {
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002))
    const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    this.blockHighlighter = new THREE.LineSegments(edges, material)
    this.blockHighlighter.visible = false
    this.scene.add(this.blockHighlighter)
  }

  _onResize() {
    const width = this.canvas.clientWidth
    const height = this.canvas.clientHeight
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  init() {
    this._onResize()
    window.addEventListener('resize', this._onResize)
  }

  _getMeshKey(blockType, faceIndex) {
    return `${blockType}_${faceIndex}`
  }

  _createInstancedMesh(blockType, faceIndex) {
    const key = this._getMeshKey(blockType, faceIndex)
    if (this.instancedMeshes.has(key)) {
      return this.instancedMeshes.get(key)
    }

    const data = BlockData[blockType]
    if (!data) return null

    const geometry = createFaceGeometry(faceIndex)
    const faceName = faceNames[faceIndex]
    const texture = generateBlockTexture(blockType, faceName)

    const transparent = data.transparent
    const opacity = blockType === BlockType.WATER ? 0.7 : blockType === BlockType.GLASS ? 0.5 : 1

    const material = new THREE.MeshLambertMaterial({
      map: texture,
      transparent,
      opacity,
      side: THREE.DoubleSide
    })

    const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances)
    mesh.count = 0
    mesh.userData = { blockType, faceIndex, positions: [] }
    this.scene.add(mesh)
    this.instancedMeshes.set(key, mesh)
    return mesh
  }

  clearWorld() {
    for (const mesh of this.instancedMeshes.values()) {
      this.scene.remove(mesh)
      mesh.geometry?.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose())
      } else {
        mesh.material?.dispose()
      }
    }
    this.instancedMeshes.clear()
    this.faceIndexMap.clear()
  }

  renderWorld(world) {
    this.clearWorld()

    const dummy = new THREE.Object3D()

    for (let x = 0; x < world.width; x++) {
      for (let y = 0; y < world.height; y++) {
        for (let z = 0; z < world.depth; z++) {
          const block = world.getBlock(x, y, z)
          if (block === BlockType.AIR) continue

          const faces = world.getBlockFaceVisibility(x, y, z)
          for (let f = 0; f < 6; f++) {
            if (!faces[f]) continue

            const key = this._getMeshKey(block, f)
            let mesh = this.instancedMeshes.get(key)
            if (!mesh) {
              mesh = this._createInstancedMesh(block, f)
              if (!mesh) continue
            }

            const idx = mesh.count
            dummy.position.set(x + 0.5, y + 0.5, z + 0.5)
            dummy.updateMatrix()
            mesh.setMatrixAt(idx, dummy.matrix)
            mesh.userData.positions.push({ x, y, z })

            const mapKey = `${x},${y},${z},${f}`
            this.faceIndexMap.set(mapKey, idx)

            mesh.count++
          }
        }
      }
    }

    for (const mesh of this.instancedMeshes.values()) {
      mesh.instanceMatrix.needsUpdate = true
    }
  }

  updateBlock(world, x, y, z) {
    const positions = [
      { x, y, z },
      { x: x + 1, y, z },
      { x: x - 1, y, z },
      { x, y: y + 1, z },
      { x, y: y - 1, z },
      { x, y, z: z + 1 },
      { x, y, z: z - 1 }
    ]

    const affectedMeshes = new Set()

    for (const pos of positions) {
      for (let f = 0; f < 6; f++) {
        const mapKey = `${pos.x},${pos.y},${pos.z},${f}`
        if (this.faceIndexMap.has(mapKey)) {
          const oldIdx = this.faceIndexMap.get(mapKey)
          const block = world.getBlock(pos.x, pos.y, pos.z)
          const key = this._getMeshKey(block, f)
          const mesh = this.instancedMeshes.get(key)
          if (mesh) {
            this._removeInstance(mesh, oldIdx, pos.x, pos.y, pos.z, f)
            affectedMeshes.add(key)
          }
        }
      }
    }

    for (const pos of positions) {
      const block = world.getBlock(pos.x, pos.y, pos.z)
      if (block === BlockType.AIR) continue

      const faces = world.getBlockFaceVisibility(pos.x, pos.y, pos.z)
      for (let f = 0; f < 6; f++) {
        if (!faces[f]) continue

        const key = this._getMeshKey(block, f)
        let mesh = this.instancedMeshes.get(key)
        if (!mesh) {
          mesh = this._createInstancedMesh(block, f)
          if (!mesh) continue
        }

        const mapKey = `${pos.x},${pos.y},${pos.z},${f}`
        if (this.faceIndexMap.has(mapKey)) continue

        const idx = mesh.count
        const dummy = new THREE.Object3D()
        dummy.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5)
        dummy.updateMatrix()
        mesh.setMatrixAt(idx, dummy.matrix)
        mesh.userData.positions.push({ x: pos.x, y: pos.y, z: pos.z })
        mesh.count++

        this.faceIndexMap.set(mapKey, idx)
        affectedMeshes.add(key)
      }
    }

    for (const key of affectedMeshes) {
      const mesh = this.instancedMeshes.get(key)
      if (mesh) {
        mesh.instanceMatrix.needsUpdate = true
      }
    }
  }

  _removeInstance(mesh, index, x, y, z, faceIndex) {
    const lastIdx = mesh.count - 1
    const mapKey = `${x},${y},${z},${faceIndex}`

    if (index < lastIdx) {
      const lastPos = mesh.userData.positions[lastIdx]
      const lastMatrix = new THREE.Matrix4()
      mesh.getMatrixAt(lastIdx, lastMatrix)
      mesh.setMatrixAt(index, lastMatrix)
      mesh.userData.positions[index] = lastPos

      const lastMapKey = `${lastPos.x},${lastPos.y},${lastPos.z},${faceIndex}`
      this.faceIndexMap.set(lastMapKey, index)
    }

    mesh.userData.positions.pop()
    mesh.count--
    this.faceIndexMap.delete(mapKey)
  }

  setHighlight(x, y, z) {
    if (x === null || y === null || z === null) {
      this.blockHighlighter.visible = false
      return
    }
    this.blockHighlighter.visible = true
    this.blockHighlighter.position.set(x + 0.5, y + 0.5, z + 0.5)
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    window.removeEventListener('resize', this._onResize)
    this.clearWorld()
    if (this.blockHighlighter) {
      this.scene.remove(this.blockHighlighter)
      this.blockHighlighter.geometry?.dispose()
      this.blockHighlighter.material?.dispose()
    }
    this.renderer.dispose()
  }
}
