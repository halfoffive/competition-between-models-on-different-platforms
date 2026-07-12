<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { getBlockIconDataURL } from '@/game/textures.js'

const store = useGameStore()

// 快捷栏图标（响应 hotbar 变化）
const hotbarIcons = computed(() => store.hotbar.map((id) => getBlockIconDataURL(id)))

// 朝向：基于 yaw 归一化到 [0,2π)，分四象限
// yaw=0 朝 -Z（北）；yaw=π/2 朝 -X（西）；yaw=π 朝 +Z（南）；yaw=3π/2 朝 +X（东）
const facing = computed(() => {
  const TWO_PI = Math.PI * 2
  let a = store.yaw % TWO_PI
  if (a < 0) a += TWO_PI
  if (a < Math.PI / 4 || a >= (Math.PI * 7) / 4) return '北 (-Z)'
  if (a < (Math.PI * 3) / 4) return '西 (-X)'
  if (a < (Math.PI * 5) / 4) return '南 (+Z)'
  return '东 (+X)'
})

// 时段：根据 timeOfDay 0-1 映射为中文时段
const timeLabel = computed(() => {
  const t = store.timeOfDay
  if (t < 0.2 || t > 0.85) return '夜晚'
  if (t < 0.35) return '黎明'
  if (t < 0.65) return '白天'
  return '黄昏'
})

// 坐标保留 1 位小数
const pos = computed(() => ({
  x: store.playerPos.x.toFixed(1),
  y: store.playerPos.y.toFixed(1),
  z: store.playerPos.z.toFixed(1)
}))
</script>

<template>
  <div class="hud-root">
    <!-- 准星 -->
    <div class="crosshair">
      <span class="ch ch-h"></span>
      <span class="ch ch-v"></span>
    </div>

    <!-- 调试信息 -->
    <div class="debug">
      <div>FPS: {{ store.fps }}</div>
      <div>XYZ: {{ pos.x }} / {{ pos.y }} / {{ pos.z }}</div>
      <div>朝向: {{ facing }}</div>
      <div>生物群系: {{ store.biome }}</div>
      <div>时间: {{ timeLabel }}</div>
    </div>

    <!-- 快捷栏 -->
    <div class="hotbar">
      <div
        v-for="(icon, i) in hotbarIcons"
        :key="i"
        class="slot"
        :class="{ active: store.selectedSlot === i }"
      >
        <img v-if="icon" :src="icon" class="slot-icon" draggable="false" alt="" />
        <span class="slot-num">{{ i + 1 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hud-root {
  position: fixed;
  inset: 0;
  pointer-events: none;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  color: #e8e8e8;
  z-index: 10;
}

/* 准星：屏幕中心十字，mix-blend-mode 保证任意背景可见 */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  mix-blend-mode: difference;
}
.ch {
  position: absolute;
  background: #ffffff;
}
.ch-h {
  top: 50%;
  left: 0;
  width: 20px;
  height: 2px;
  transform: translateY(-50%);
}
.ch-v {
  left: 50%;
  top: 0;
  width: 2px;
  height: 20px;
  transform: translateX(-50%);
}

/* 调试信息：左上角 */
.debug {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  line-height: 1.8;
  text-shadow: 1px 1px 0 #000;
  white-space: nowrap;
}

/* 快捷栏：底部居中 */
.hotbar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(20, 20, 25, 0.6);
  border: 2px solid #2a2a30;
}
.slot {
  position: relative;
  width: 48px;
  height: 48px;
  background: #8b8b8b;
  border: 2px solid #373737;
  box-shadow: inset 2px 2px 0 #c6c6c6, inset -2px -2px 0 #5a5a5a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s;
}
.slot.active {
  border-color: #ffffff;
  transform: translateY(-4px);
  box-shadow: inset 2px 2px 0 #ffffff, inset -2px -2px 0 #5a5a5a, 0 0 0 2px #ffffff;
}
.slot-icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
  -ms-interpolation-mode: nearest-neighbor;
  pointer-events: none;
  user-select: none;
}
.slot-num {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: 8px;
  color: #d0d0d0;
  text-shadow: 1px 1px 0 #000;
}
</style>
