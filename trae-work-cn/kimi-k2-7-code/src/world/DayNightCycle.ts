import { Scene, Color, DirectionalLight, AmbientLight, Fog } from 'three'

const DAY_COLOR = new Color(0x87ceeb)
const DUSK_COLOR = new Color(0xff9966)
const NIGHT_COLOR = new Color(0x0a0a2a)

const SUN_BASE_INTENSITY = 1.2
const MOON_BASE_INTENSITY = 0.35
const AMBIENT_BASE_INTENSITY = 0.45

const DAY_SECONDS = 48
const HOURS_PER_SECOND = 24 / DAY_SECONDS

export class DayNightCycle {
  private scene: Scene
  private sun: DirectionalLight
  private moon: DirectionalLight
  private ambient: AmbientLight
  private fog: Fog

  private time = 8

  constructor(scene: Scene, sun: DirectionalLight, ambient: AmbientLight, fog: Fog) {
    this.scene = scene
    this.sun = sun
    this.moon = new DirectionalLight(0xaaccff, 0)
    this.moon.castShadow = false
    this.scene.add(this.moon)
    this.ambient = ambient
    this.fog = fog
  }

  getTime(): number {
    return this.time
  }

  setTime(hour: number): void {
    this.time = ((hour % 24) + 24) % 24
  }

  update(dt: number): void {
    this.time += dt * HOURS_PER_SECOND
    if (this.time >= 24) this.time -= 24

    const angle = ((this.time - 6) / 24) * Math.PI * 2
    const sunHeight = Math.sin(angle)

    const radius = 200
    this.sun.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0)
    this.sun.intensity = Math.max(0, sunHeight) * SUN_BASE_INTENSITY

    const moonAngle = angle + Math.PI
    this.moon.position.set(Math.cos(moonAngle) * radius, Math.sin(moonAngle) * radius, 0)
    this.moon.intensity = Math.max(0, -sunHeight) * MOON_BASE_INTENSITY

    const skyColor = this.computeSkyColor(sunHeight)
    this.scene.background = skyColor
    this.fog.color.copy(skyColor)

    const ambientIntensity = AMBIENT_BASE_INTENSITY * (0.2 + 0.8 * Math.max(0, sunHeight))
    this.ambient.intensity = Math.max(0.08, ambientIntensity)
  }

  private computeSkyColor(sunHeight: number): Color {
    if (sunHeight > 0) {
      const t = smoothStep(0, 0.25, sunHeight)
      return DUSK_COLOR.clone().lerp(DAY_COLOR, t)
    }
    const t = smoothStep(0, -0.25, sunHeight)
    return DUSK_COLOR.clone().lerp(NIGHT_COLOR, t)
  }

  dispose(): void {
    this.scene.remove(this.moon)
    this.moon.dispose()
  }
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
