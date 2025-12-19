import { fillRoundRect } from '../../extras/roundRect.js'

const RES = 2
const NAMETAG_WIDTH = 200 * RES
const NAMETAG_HEIGHT = 35 * RES
const PER_ROW = 5
const NAME_FONT_SIZE = 16 * RES
const NAME_OUTLINE_SIZE = 4 * RES
const HEALTH_MAX = 100
const HEALTH_HEIGHT = 12 * RES
const HEALTH_WIDTH = 100 * RES
const HEALTH_BORDER = 1.5 * RES
const HEALTH_BORDER_RADIUS = 20 * RES

export class NametagCanvas {
  constructor(canvas, texture) {
    this.canvas = canvas
    this.texture = texture
    this.ctx = canvas.getContext('2d')
  }

  draw(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const x = col * NAMETAG_WIDTH
    const y = row * NAMETAG_HEIGHT

    this.ctx.clearRect(x, y, NAMETAG_WIDTH, NAMETAG_HEIGHT)
    this.ctx.font = `800 ${NAME_FONT_SIZE}px Rubik`
    this.ctx.fillStyle = 'white'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.lineWidth = NAME_OUTLINE_SIZE
    this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'

    const text = this.fitText(nametag.name, NAMETAG_WIDTH)
    this.ctx.save()
    this.ctx.globalCompositeOperation = 'xor'
    this.ctx.globalAlpha = 1
    this.ctx.strokeText(text, x + NAMETAG_WIDTH / 2, y + 2 + 2)
    this.ctx.restore()
    this.ctx.fillText(text, x + NAMETAG_WIDTH / 2, y + 2 + 2)

    if (nametag.health < HEALTH_MAX) {
      {
        const fillStyle = 'rgba(0, 0, 0, 0.6)'
        const width = HEALTH_WIDTH
        const height = HEALTH_HEIGHT
        const left = x + (NAMETAG_WIDTH - HEALTH_WIDTH) / 2
        const top = y + NAME_FONT_SIZE + 5
        const borderRadius = HEALTH_BORDER_RADIUS
        fillRoundRect(this.ctx, left, top, width, height, borderRadius, fillStyle)
      }
      {
        const fillStyle = '#229710'
        const maxWidth = HEALTH_WIDTH - HEALTH_BORDER * 2
        const perc = nametag.health / HEALTH_MAX
        const width = maxWidth * perc
        const height = HEALTH_HEIGHT - HEALTH_BORDER * 2
        const left = x + (NAMETAG_WIDTH - HEALTH_WIDTH) / 2 + HEALTH_BORDER
        const top = y + NAME_FONT_SIZE + 5 + HEALTH_BORDER
        const borderRadius = HEALTH_BORDER_RADIUS
        fillRoundRect(this.ctx, left, top, width, height, borderRadius, fillStyle)
      }
    }

    this.texture.needsUpdate = true
  }

  fitText(text, maxWidth) {
    const width = this.ctx.measureText(text).width
    if (width <= maxWidth) {
      return text
    }
    const ellipsis = '...'
    let truncated = text
    const ellipsisWidth = this.ctx.measureText(ellipsis).width
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1)
      const truncatedWidth = this.ctx.measureText(truncated).width
      if (truncatedWidth + ellipsisWidth <= maxWidth) {
        return truncated + ellipsis
      }
    }
    return ellipsis
  }

  clear(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const x = col * NAMETAG_WIDTH
    const y = row * NAMETAG_HEIGHT
    this.ctx.clearRect(x, y, NAMETAG_WIDTH, NAMETAG_HEIGHT)
    this.texture.needsUpdate = true
  }
}
