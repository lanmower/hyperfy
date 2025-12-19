import * as THREE from '../../extras/three.js'

const sizes = [128, 256, 512, 2048, 4096]

export class ActionBoard {
  constructor(width, height, pxToMeters, world) {
    this.width = width
    this.height = height
    this.pxToMeters = pxToMeters
    this.world = world

    const max = Math.max(width, height)
    const size = sizes.find(size => size >= max)
    this.size = size
    this.pr = 1

    this.canvas = document.createElement('canvas')
    this.canvas.width = size * this.pr
    this.canvas.height = size * this.pr
    this.ctx = this.canvas.getContext('2d')

    this.texture = null
    this.mesh = null
  }

  drawBox(x, y, width, height, radius, color) {
    x *= this.pr
    y *= this.pr
    width *= this.pr
    height *= this.pr
    radius *= this.pr
    this.ctx.fillStyle = color
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.arcTo(x + width, y, x + width, y + height, radius)
    this.ctx.arcTo(x + width, y + height, x, y + height, radius)
    this.ctx.arcTo(x, y + height, x, y, radius)
    this.ctx.arcTo(x, y, x + width, y, radius)
    this.ctx.closePath()
    this.ctx.fill()
  }

  drawCircle(x, y, radius, color) {
    x *= this.pr
    y *= this.pr
    radius *= this.pr
    const centerX = x + radius
    const centerY = y + radius
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  drawPie(x, y, radius, percent, color, offset = 0) {
    x *= this.pr
    y *= this.pr
    radius *= this.pr
    const offsetRadians = (offset * Math.PI) / 180
    const startAngle = -0.5 * Math.PI + offsetRadians
    const endAngle = startAngle + (percent / 100) * 2 * Math.PI
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y + radius)
    this.ctx.arc(x + radius, y + radius, radius, startAngle, endAngle)
    this.ctx.lineTo(x + radius, y + radius)
    this.ctx.closePath()
    this.ctx.fillStyle = color
    this.ctx.fill()
  }

  measureText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
    fontSize *= this.pr
    this.ctx.font = `${fontWeight} ${fontSize}px ${font}`
    const metrics = this.ctx.measureText(text)
    return { width: metrics.width / this.pr }
  }

  drawText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
    x *= this.pr
    y *= this.pr
    fontSize *= this.pr
    this.ctx.fillStyle = color
    this.ctx.font = `${fontWeight} ${fontSize}px ${font}`
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(text, x, y)
  }

  getMesh() {
    if (this.mesh) return this.mesh

    const offsetX = 0
    const offsetY = 0
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.anisotropy = this.world.graphics.maxAnisotropy
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter

    const geometry = new THREE.BufferGeometry()
    const halfWidth = (this.width * this.pxToMeters) / 2
    const halfHeight = (this.height * this.pxToMeters) / 2
    const vertices = new Float32Array([
      halfWidth, -halfHeight, 0,
      halfWidth, halfHeight, 0,
      -halfWidth, halfHeight, 0,
      -halfWidth, -halfHeight, 0,
    ])
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

    const uvX1 = offsetX / this.size
    const uvY1 = 1 - offsetY / this.size
    const uvX2 = (offsetX + this.width) / this.size
    const uvY2 = 1 - (offsetY + this.height) / this.size
    const uvs = new Float32Array([
      uvX2, uvY2,
      uvX2, uvY1,
      uvX1, uvY1,
      uvX1, uvY2,
    ])
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

    const indices = new Uint16Array([
      0, 1, 2,
      2, 3, 0
    ])
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    const material = new THREE.MeshBasicMaterial({ map: this.texture })
    material.toneMapped = false
    material.depthTest = false
    material.depthWrite = false
    material.transparent = true

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.renderOrder = 999
    return this.mesh
  }

  commit() {
    if (!this.texture) return
    this.texture.needsUpdate = true
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }
}
