import { reactive, computed } from 'vue'
import { BlockType, PLACEABLE_BLOCK_TYPES } from '@/blocks/BlockType'

interface GameState {
  selectedIndex: number
  locked: boolean
}

export const gameState = reactive<GameState>({
  selectedIndex: 0,
  locked: false,
})

export const selectedBlockType = computed<BlockType>(() => {
  return PLACEABLE_BLOCK_TYPES[gameState.selectedIndex] ?? BlockType.Grass
})

export function setSelectedIndex(index: number): void {
  if (index >= 0 && index < PLACEABLE_BLOCK_TYPES.length) {
    gameState.selectedIndex = index
  }
}

export function cycleSelectedIndex(delta: number): void {
  const len = PLACEABLE_BLOCK_TYPES.length
  let next = gameState.selectedIndex + delta
  next = ((next % len) + len) % len
  gameState.selectedIndex = next
}
