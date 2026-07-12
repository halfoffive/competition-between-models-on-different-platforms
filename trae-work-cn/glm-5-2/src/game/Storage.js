// 存档/读档系统
// 把世界（仅玩家修改过的区块）、玩家位置与朝向、时间、种子、快捷栏序列化到 localStorage
// 区块数据用 base64 编码以减小体积，并限制最多 100 个区块防溢出
export class Storage {
  constructor() {
    this.SAVE_KEY = 'voxel-save'
    // 最多保存的区块数量，防止 localStorage 配额溢出
    this.MAX_CHUNKS = 100
  }

  // 保存到 localStorage
  // 返回 true 表示成功，false 表示失败
  save(world, player, store) {
    const data = {
      seed: store.worldSeed,
      time: store.timeOfDay,
      playerPos: { x: player.position.x, y: player.position.y, z: player.position.z },
      yaw: player.yaw,
      pitch: player.pitch,
      flying: player.flying,
      hotbar: [...store.hotbar],
      chunks: []
    }

    // 只保存修改过的区块
    let count = 0
    for (const [, chunk] of world.chunks) {
      if (chunk.modified && count < this.MAX_CHUNKS) {
        data.chunks.push({
          cx: chunk.cx,
          cz: chunk.cz,
          data: this.uint8ToBase64(chunk.data)
        })
        count++
      }
    }

    try {
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data))
      store.hasSave = true
      return true
    } catch (e) {
      console.error('存档失败', e)
      return false
    }
  }

  // 读取存档，返回 data 对象或 null
  load() {
    const raw = localStorage.getItem(this.SAVE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (e) {
      console.error('读档失败', e)
      return null
    }
  }

  // 世界初始化后应用存档数据
  applyLoadedData(data, world, player, store) {
    // 恢复时间
    store.setTimeOfDay(data.time)
    // 恢复快捷栏
    if (Array.isArray(data.hotbar)) {
      for (let i = 0; i < data.hotbar.length; i++) {
        store.setHotbarSlot(i, data.hotbar[i])
      }
    }
    // 恢复玩家位置与朝向
    if (data.playerPos) {
      player.position.set(data.playerPos.x, data.playerPos.y, data.playerPos.z)
    }
    if (typeof data.yaw === 'number') player.yaw = data.yaw
    if (typeof data.pitch === 'number') player.pitch = data.pitch
    if (typeof data.flying === 'boolean') player.flying = data.flying
    player.velocity.set(0, 0, 0)

    // 恢复修改过的区块：覆盖已生成区块的 data，或现场生成后覆盖
    if (Array.isArray(data.chunks)) {
      for (const c of data.chunks) {
        const key = `${c.cx},${c.cz}`
        let chunk = world.chunks.get(key)
        if (!chunk) {
          chunk = world.generateChunk(c.cx, c.cz)
        }
        chunk.data = this.base64ToUint8(c.data)
        chunk.modified = true
        chunk.dirty = true
        world.enqueueRebuild(chunk)
      }
    }
  }

  // 检查是否存在存档
  hasSave() {
    try {
      return !!localStorage.getItem(this.SAVE_KEY)
    } catch (e) {
      return false
    }
  }

  // 清除存档
  deleteSave() {
    try {
      localStorage.removeItem(this.SAVE_KEY)
      return true
    } catch (e) {
      console.error('删除存档失败', e)
      return false
    }
  }

  // Uint8Array -> base64 字符串
  uint8ToBase64(arr) {
    let binary = ''
    const chunkSize = 0x8000 // 防止 fromCharCode 一次传入过长参数栈溢出
    for (let i = 0; i < arr.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, arr.subarray(i, i + chunkSize))
    }
    return btoa(binary)
  }

  // base64 字符串 -> Uint8Array
  base64ToUint8(b64) {
    const binary = atob(b64)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return arr
  }
}
