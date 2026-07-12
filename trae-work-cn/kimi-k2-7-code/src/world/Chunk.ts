export const CHUNK_SIZE = 16
export const CHUNK_HEIGHT = 128
export const WATER_LEVEL = 32

export interface ChunkCoord {
  x: number
  z: number
}

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`
}

export function worldToChunk(worldX: number, worldZ: number): ChunkCoord {
  return {
    x: Math.floor(worldX / CHUNK_SIZE),
    z: Math.floor(worldZ / CHUNK_SIZE),
  }
}

export function worldToChunkLocal(worldX: number, worldZ: number): { lx: number; lz: number } {
  let lx = worldX % CHUNK_SIZE
  let lz = worldZ % CHUNK_SIZE
  if (lx < 0) lx += CHUNK_SIZE
  if (lz < 0) lz += CHUNK_SIZE
  return { lx, lz }
}
