/** 简单的 AABB 包围盒 */
export class AABB {
  constructor(public minX = 0, public minY = 0, public minZ = 0, public maxX = 0, public maxY = 0, public maxZ = 0) {}

  static from(x: number, y: number, z: number, w: number, h: number, d: number): AABB {
    return new AABB(x, y, z, x + w, y + h, z + d)
  }

  static copy(a: AABB): AABB {
    return new AABB(a.minX, a.minY, a.minZ, a.maxX, a.maxY, a.maxZ)
  }

  offset(dx: number, dy: number, dz: number): AABB {
    return new AABB(this.minX + dx, this.minY + dy, this.minZ + dz, this.maxX + dx, this.maxY + dy, this.maxZ + dz)
  }

  expand(w: number, h: number, d: number): AABB {
    return new AABB(this.minX - w, this.minY - h, this.minZ - d, this.maxX + w, this.maxY + h, this.maxZ + d)
  }

  intersects(other: AABB): boolean {
    return this.minX < other.maxX && this.maxX > other.minX &&
           this.minY < other.maxY && this.maxY > other.minY &&
           this.minZ < other.maxZ && this.maxZ > other.minZ
  }
}
