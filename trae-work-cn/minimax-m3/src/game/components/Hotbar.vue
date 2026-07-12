<script setup lang="ts">
import { useGameStore } from '../stores/game'
import { registry } from '@/engine/world/BlockRegistry'
import { computed } from 'vue'
import { BlockId } from '@/engine/world/BlockId'

const store = useGameStore()

const slots = computed(() => {
  const out = []
  for (let i = 0; i < 9; i++) {
    const item = store.inventory[i] || null
    const props = item ? registry.get(item.id) : null
    out.push({ index: i, item, props })
  }
  return out
})

function itemStyle(id: BlockId) {
  // 用 atlas 纹理或占位色
  const texMap: Partial<Record<BlockId, { color: string; glow?: boolean }>> = {
    [BlockId.GRASS]: { color: '#5fa13e' },
    [BlockId.DIRT]: { color: '#8b5a2b' },
    [BlockId.STONE]: { color: '#7e7e7e' },
    [BlockId.COBBLESTONE]: { color: '#6b6b6b' },
    [BlockId.SAND]: { color: '#e6d6a0' },
    [BlockId.GRAVEL]: { color: '#888' },
    [BlockId.BEDROCK]: { color: '#3a3a3a' },
    [BlockId.SNOW_BLOCK]: { color: '#f5f8ff' },
    [BlockId.CLAY]: { color: '#a4b6c4' },
    [BlockId.OAK_LOG]: { color: '#7a5832' },
    [BlockId.OAK_LEAVES]: { color: '#3e8a2a' },
    [BlockId.OAK_PLANKS]: { color: '#b88a4a' },
    [BlockId.SPRUCE_LOG]: { color: '#3a2a1a' },
    [BlockId.SPRUCE_LEAVES]: { color: '#2a5a20' },
    [BlockId.COAL_ORE]: { color: '#666' },
    [BlockId.IRON_ORE]: { color: '#a89478' },
    [BlockId.GOLD_ORE]: { color: '#cfb060' },
    [BlockId.DIAMOND_ORE]: { color: '#7bd' },
    [BlockId.REDSTONE_ORE]: { color: '#d44' },
    [BlockId.WATER]: { color: '#3a64c8' },
    [BlockId.LAVA]: { color: '#e85a20', glow: true },
    [BlockId.GLASS]: { color: '#cfe' },
    [BlockId.TNT]: { color: '#cc2a2a' },
    [BlockId.GRASS_PATH]: { color: '#a08558' },
    [BlockId.CRAFTING_TABLE]: { color: '#8a6238' },
    [BlockId.FURNACE]: { color: '#666' },
    [BlockId.CHEST]: { color: '#7a5020' },
    [BlockId.TORCH]: { color: '#ffb84a', glow: true },
    [BlockId.GLOWSTONE]: { color: '#fce58a', glow: true },
    [BlockId.FLOWER_RED]: { color: '#dc2a2a' },
    [BlockId.FLOWER_YELLOW]: { color: '#ffea5a' },
    [BlockId.TALL_GRASS]: { color: '#3a8a2a' },
    [BlockId.CACTUS]: { color: '#4a8a2a' },
    [BlockId.BOOKSHELF]: { color: '#8a6238' },
    [BlockId.BED]: { color: '#cc4040' },
    [BlockId.WHEAT]: { color: '#d4a050' },
    [BlockId.IRON_INGOT]: { color: '#dadada' },
    [BlockId.GOLD_INGOT]: { color: '#f4d044' },
    [BlockId.DIAMOND]: { color: '#5cf' },
    [BlockId.COAL]: { color: '#222' },
    [BlockId.STICK]: { color: '#8a6238' },
    [BlockId.BREAD]: { color: '#c08850' },
    [BlockId.FLINT]: { color: '#444' },
    [BlockId.BOOK]: { color: '#705030' },
    [BlockId.GLOWSTONE_DUST]: { color: '#fce58a' },
    [BlockId.GUNPOWDER]: { color: '#555' },
  }
  const m = texMap[id] || { color: '#888' }
  return {
    background: m.color,
    boxShadow: m.glow ? `0 0 8px ${m.color}` : 'none',
  }
}
</script>

<template>
  <div class="hotbar">
    <div
      v-for="slot in slots"
      :key="slot.index"
      class="slot"
      :class="{ selected: slot.index === store.hotbarSlot }"
    >
      <div
        v-if="slot.item"
        class="item"
        :style="itemStyle(slot.item.id)"
        :title="slot.props?.name"
      />
      <span v-if="slot.item && slot.item.count > 1" class="count">{{ slot.item.count }}</span>
      <span v-if="slot.index === store.hotbarSlot" class="indicator"></span>
    </div>
  </div>
</template>

<style scoped>
.hotbar {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  z-index: 10;
  backdrop-filter: blur(4px);
}
.slot {
  position: relative;
  width: 56px;
  height: 56px;
  background: rgba(20, 20, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.1s;
}
.slot.selected {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.4);
  transform: scale(1.08);
}
.item {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  image-rendering: pixelated;
  box-shadow: inset -2px -2px 0 rgba(0, 0, 0, 0.3), inset 2px 2px 0 rgba(255, 255, 255, 0.15);
}
.count {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
}
.indicator {
  position: absolute;
  inset: 0;
  border: 2px solid #fff;
  border-radius: 3px;
  pointer-events: none;
}
</style>
