import * as THREE from '../extras/three.js'
import { System } from './System.js'

const targetSVG = '<svg width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="12" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="15" r="6" stroke="currentColor" stroke-width="1"/><line x1="15" y1="3" x2="15" y2="8" stroke="currentColor" stroke-width="1"/><line x1="15" y1="22" x2="15" y2="27" stroke="currentColor" stroke-width="1"/><line x1="3" y1="15" x2="8" y2="15" stroke="currentColor" stroke-width="1"/><line x1="22" y1="15" x2="27" y2="15" stroke="currentColor" stroke-width="1"/></svg>'

export class ClientTarget extends System {
  static DEPS = {
    camera: 'camera',
  }

  constructor(world) {
    super(world)
  }

  init({ ui }) {
    this.ui = ui
  }

  start() {
    this.guide = document.createElement('div')
    this.guide.style.position = 'absolute'
    this.guide.style.width = '30px'
    this.guide.style.height = '30px'
    this.guide.style.display = 'flex'
    this.guide.style.alignItems = 'center'
    this.guide.style.justifyContent = 'center'
    this.guide.style.transform = 'translate(-50%, -50%)'
    this.guide.style.filter = 'drop-shadow(0px 0px 4px rgba(0, 0, 0, 0.25))'
    this.guide.innerHTML = targetSVG
  }

  show(vec3) {
    if (!this.ui || typeof this.ui.getBoundingClientRect !== 'function') return
    this.target = vec3
    this.ui.appendChild(this.guide)
    this.bounds = this.ui.getBoundingClientRect()
  }

  hide() {
    if (this.target) {
      this.target = null
      this.ui.removeChild(this.guide)
    }
  }

  lateUpdate() {
    if (!this.target) return

    const vector = new THREE.Vector3().copy(this.target)
    vector.project(this.camera)

    const x = ((vector.x + 1) * this.bounds.width) / 2
    const y = ((-vector.y + 1) * this.bounds.height) / 2

    if (vector.z > 1) {
      this.guide.style.display = 'none'
      return
    }

    if (vector.x >= -1 && vector.x <= 1 && vector.y >= -1 && vector.y <= 1) {
      this.guide.style.left = `${x}px`
      this.guide.style.top = `${y}px`
      this.guide.style.display = 'block'
    } else {
      const centerX = this.bounds.width / 2
      const centerY = this.bounds.height / 2

      const pt = intersectLineWithRect(
        centerX,
        centerY,
        x,
        y,
        this.bounds.width,
        this.bounds.height
      )

      if (pt) {
        this.guide.style.left = `${pt.x}px`
        this.guide.style.top = `${pt.y}px`
        this.guide.style.display = 'block'
      }
    }
  }
}

function intersectLineWithRect(cx, cy, x, y, width, height, padding = 0) {
  const dx = x - cx
  const dy = y - cy

  if (dx === 0 && dy === 0) return { x: cx, y: cy }

  let tMin = Number.POSITIVE_INFINITY

  if (dx !== 0) {
    const t = (0 - cx) / dx
    if (t > 0) {
      const iy = cy + t * dy
      if (iy >= 0 && iy <= height) {
        tMin = Math.min(tMin, t)
      }
    }
  }
  if (dx !== 0) {
    const t = (width - cx) / dx
    if (t > 0) {
      const iy = cy + t * dy
      if (iy >= 0 && iy <= height) {
        tMin = Math.min(tMin, t)
      }
    }
  }
  if (dy !== 0) {
    const t = (0 - cy) / dy
    if (t > 0) {
      const ix = cx + t * dx
      if (ix >= 0 && ix <= width) {
        tMin = Math.min(tMin, t)
      }
    }
  }
  if (dy !== 0) {
    const t = (height - cy) / dy
    if (t > 0) {
      const ix = cx + t * dx
      if (ix >= 0 && ix <= width) {
        tMin = Math.min(tMin, t)
      }
    }
  }

  if (tMin === Number.POSITIVE_INFINITY) {
    return null
  }

  const ix = cx + tMin * dx
  const iy = cy + tMin * dy

  const clampedX = Math.min(Math.max(ix, padding), width - padding)
  const clampedY = Math.min(Math.max(iy, padding), height - padding)

  return { x: clampedX, y: clampedY }
}
