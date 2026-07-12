import { createNoise2D, createNoise3D } from 'simplex-noise';
import {
  WORLD_SIZE_X,
  WORLD_SIZE_Y,
  WORLD_SIZE_Z,
  AIR,
  GRASS,
  DIRT,
  STONE,
  OAK_LOG,
  LEAVES,
  SAND,
  WATER,
  BEDROCK,
  isSolid as blockIsSolid
} from './blocks.js';

const SEA_LEVEL = 25;

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class World {
  constructor(seed = 12345) {
    this.seed = seed;
    this.random = mulberry32(seed);
    this.data = new Uint8Array(WORLD_SIZE_X * WORLD_SIZE_Y * WORLD_SIZE_Z);
    this.noise2D = createNoise2D(() => this.random());
    this.noise3D = createNoise3D(() => this.random());
    this.generate();
  }

  getIndex(x, y, z) {
    return y * WORLD_SIZE_X * WORLD_SIZE_Z + z * WORLD_SIZE_X + x;
  }

  inBounds(x, y, z) {
    return x >= 0 && x < WORLD_SIZE_X &&
           y >= 0 && y < WORLD_SIZE_Y &&
           z >= 0 && z < WORLD_SIZE_Z;
  }

  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) return BEDROCK;
    return this.data[this.getIndex(x, y, z)];
  }

  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    this.data[this.getIndex(x, y, z)] = id;
  }

  isSolid(x, y, z) {
    return blockIsSolid(this.getBlock(x, y, z));
  }

  generate() {
    const heightMap = new Int32Array(WORLD_SIZE_X * WORLD_SIZE_Z);

    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let z = 0; z < WORLD_SIZE_Z; z++) {
        const lowFreq = this.noise2D(x * 0.017, z * 0.017) * 12;
        const medFreq = this.noise2D(x * 0.05, z * 0.05) * 4;
        const highFreq = this.noise2D(x * 0.15, z * 0.15) * 1.5;
        const height = Math.floor(SEA_LEVEL + lowFreq + medFreq + highFreq);
        heightMap[z * WORLD_SIZE_X + x] = Math.max(10, Math.min(45, height));
      }
    }

    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let z = 0; z < WORLD_SIZE_Z; z++) {
        const height = heightMap[z * WORLD_SIZE_X + x];

        this.setBlock(x, 0, z, BEDROCK);

        for (let y = 1; y < height - 4; y++) {
          this.setBlock(x, y, z, STONE);
        }

        for (let y = Math.max(1, height - 4); y < height; y++) {
          this.setBlock(x, y, z, DIRT);
        }

        if (height <= SEA_LEVEL + 2) {
          this.setBlock(x, height, z, SAND);
        } else {
          this.setBlock(x, height, z, GRASS);
        }

        for (let y = height + 1; y <= SEA_LEVEL; y++) {
          this.setBlock(x, y, z, WATER);
        }
      }
    }

    for (let x = 0; x < WORLD_SIZE_X; x++) {
      for (let y = 1; y < 40; y++) {
        for (let z = 0; z < WORLD_SIZE_Z; z++) {
          const caveNoise = this.noise3D(x * 0.04, y * 0.04, z * 0.04);
          const caveNoise2 = this.noise3D(x * 0.08, y * 0.08, z * 0.08) * 0.5;
          if (caveNoise + caveNoise2 > 0.55 && this.getBlock(x, y, z) === STONE && y > 2) {
            this.setBlock(x, y, z, AIR);
          }
        }
      }
    }

    for (let x = 2; x < WORLD_SIZE_X - 2; x++) {
      for (let z = 2; z < WORLD_SIZE_Z - 2; z++) {
        const height = heightMap[z * WORLD_SIZE_X + x];
        if (height > SEA_LEVEL + 2 && this.getBlock(x, height, z) === GRASS) {
          if (this.random() < 1 / 80) {
            this.generateTree(x, height + 1, z);
          }
        }
      }
    }
  }

  generateTree(x, y, z) {
    const trunkHeight = 4 + Math.floor(this.random() * 3);

    for (let i = 0; i < trunkHeight; i++) {
      if (this.inBounds(x, y + i, z)) {
        this.setBlock(x, y + i, z, OAK_LOG);
      }
    }

    const trunkTop = y + trunkHeight - 1;

    for (let dy = -2; dy < 0; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          const isCorner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
          if (isCorner) continue;
          const lx = x + dx;
          const ly = trunkTop + dy;
          const lz = z + dz;
          if (this.inBounds(lx, ly, lz) && this.getBlock(lx, ly, lz) === AIR) {
            this.setBlock(lx, ly, lz, LEAVES);
          }
        }
      }
    }

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const lx = x + dx;
        const ly = trunkTop;
        const lz = z + dz;
        if (this.inBounds(lx, ly, lz) && this.getBlock(lx, ly, lz) === AIR) {
          this.setBlock(lx, ly, lz, LEAVES);
        }
      }
    }
  }
}
