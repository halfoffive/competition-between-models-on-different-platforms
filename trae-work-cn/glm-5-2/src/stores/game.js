import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HOTBAR } from '@/game/blocks.js'

// 检查 localStorage 是否存在存档
function checkHasSave() {
  try {
    return !!localStorage.getItem('voxel-save')
  } catch (e) {
    return false
  }
}

// 游戏全局状态 store（setup store 风格）
export const useGameStore = defineStore('game', () => {
  // 当前屏幕：'menu' 主菜单 / 'game' 游戏中
  const screen = ref('menu')
  // 是否暂停
  const paused = ref(false)
  // 游戏是否运行中
  const running = ref(false)
  // 玩家位置
  const playerPos = ref({ x: 0, y: 70, z: 0 })
  // 玩家视角 yaw/pitch（弧度），供 HUD 显示朝向
  const yaw = ref(0)
  const pitch = ref(0)
  // 选中的物品栏格子 0-8
  const selectedSlot = ref(0)
  // 一天中的时刻 0-1（0=午夜，0.25=日出，0.5=正午，0.75=日落）
  const timeOfDay = ref(0.3)
  // 帧率
  const fps = ref(0)
  // 当前生物群系
  const biome = ref('plains')
  // 背包是否打开
  const inventoryOpen = ref(false)
  // 渲染距离（区块数）
  const renderDistance = ref(6)
  // 世界种子
  const worldSeed = ref(12345)
  // 是否存在存档
  const hasSave = ref(checkHasSave())
  // 可写快捷栏：HOTBAR 的副本，合成产物会写入对应槽位
  const hotbar = ref([...HOTBAR])

  function setScreen(s) {
    screen.value = s
  }
  function togglePause() {
    paused.value = !paused.value
  }
  // ESC 释放指针锁后请求暂停（仅设置状态，不操作指针锁）
  function requestPause() {
    paused.value = true
  }
  // 恢复游戏：取消暂停。指针锁定由用户点击按钮后由 App 触发请求
  function resume() {
    paused.value = false
  }
  function setRunning(v) {
    running.value = v
  }
  function setPlayerPos(pos) {
    playerPos.value = { ...pos }
  }
  function setYawPitch(y, p) {
    yaw.value = y
    pitch.value = p
  }
  function setSelectedSlot(i) {
    selectedSlot.value = i
  }
  function setTimeOfDay(t) {
    timeOfDay.value = t
  }
  function setFps(f) {
    fps.value = f
  }
  function setBiome(b) {
    biome.value = b
  }
  function toggleInventory() {
    inventoryOpen.value = !inventoryOpen.value
  }
  function setRenderDistance(d) {
    renderDistance.value = d
  }
  // 设置快捷栏某槽位的方块 ID
  function setHotbarSlot(index, blockId) {
    if (index < 0 || index >= hotbar.value.length) return
    hotbar.value[index] = blockId
  }

  return {
    // 状态
    screen,
    paused,
    running,
    playerPos,
    yaw,
    pitch,
    selectedSlot,
    timeOfDay,
    fps,
    biome,
    inventoryOpen,
    renderDistance,
    worldSeed,
    hasSave,
    hotbar,
    // 方法
    setScreen,
    togglePause,
    requestPause,
    resume,
    setRunning,
    setPlayerPos,
    setYawPitch,
    setSelectedSlot,
    setTimeOfDay,
    setFps,
    setBiome,
    toggleInventory,
    setRenderDistance,
    setHotbarSlot
  }
})
