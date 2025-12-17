import * as THREE from 'three'

const sizes = [128, 256, 512, 2048, 4096]

export function createBoard(width, height, pxToMeters, world) {
  const max = Math.max(width, height)
  const size = sizes.find(size => size >= max)
  const pr = 1
  const canvas = document.createElement('canvas')
  canvas.width = size * pr
  canvas.height = size * pr
  const ctx = canvas.getContext('2d')

  let texture
  let mesh

  return {
    canvas,
    drawBox(x, y, width, height, radius, color) {
      x *= pr
      y *= pr
      width *= pr
      height *= pr
      radius *= pr
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.arcTo(x + width, y, x + width, y + height, radius)
      ctx.arcTo(x + width, y + height, x, y + height, radius)
      ctx.arcTo(x, y + height, x, y, radius)
      ctx.arcTo(x, y, x + width, y, radius)
      ctx.closePath()
      ctx.fill()
    },
    drawCircle(x, y, radius, color) {
      x *= pr
      y *= pr
      radius *= pr
      const centerX = x + radius
      const centerY = y + radius
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    },
    drawPie(x, y, radius, percent, color, offset = 0) {
      x *= pr
      y *= pr
      radius *= pr
      const offsetRadians = (offset * Math.PI) / 180
      const startAngle = -0.5 * Math.PI + offsetRadians
      const endAngle = startAngle + (percent / 100) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(x + radius, y + radius)
      ctx.arc(x + radius, y + radius, radius, startAngle, endAngle)
      ctx.lineTo(x + radius, y + radius)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    },
    measureText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      fontSize *= pr
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      const metrics = ctx.measureText(text)
      return {
        width: metrics.width / pr,
      }
    },
    drawText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      x *= pr
      y *= pr
      fontSize *= pr
      ctx.fillStyle = color
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(text, x, y)
    },
    getMesh() {
      if (mesh) return mesh
      const offsetX = 0
      const offsetY = 0
      texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = world.graphics.maxAnisotropy
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      const geometry = new THREE.BufferGeometry()
      const halfWidth = (width * pxToMeters) / 2
      const halfHeight = (height * pxToMeters) / 2
      const vertices = new Float32Array([
        halfWidth, -halfHeight, 0,
        halfWidth, halfHeight, 0,
        -halfWidth, halfHeight, 0,
        -halfWidth, -halfHeight, 0,
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      const uvX1 = offsetX / size
      const uvY1 = 1 - offsetY / size
      const uvX2 = (offsetX + width) / size
      const uvY2 = 1 - (offsetY + height) / size
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
      const material = new THREE.MeshBasicMaterial({ map: texture })
      material.toneMapped = false
      mesh = new THREE.Mesh(geometry, material)
      material.depthTest = false
      material.depthWrite = false
      material.transparent = true
      mesh.renderOrder = 999
      return mesh
    },
    commit() {
      if (!texture) return
      texture.needsUpdate = true
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
