import { fillRoundRect } from '../../extras/roundRect.js'

const NAMETAG_WIDTH = 200 * 2
const NAMETAG_HEIGHT = 35 * 2
const NAMETAG_BORDER_RADIUS = 10 * 2

const NAME_FONT_SIZE = 16 * 2
const NAME_OUTLINE_SIZE = 4 * 2

const HEALTH_MAX = 100
const HEALTH_HEIGHT = 12 * 2
const HEALTH_WIDTH = 100 * 2
const HEALTH_BORDER = 1.5 * 2
const HEALTH_BORDER_RADIUS = 20 * 2

const PER_ROW = 5
const PER_COLUMN = 20

export class NametagRenderer {
  constructor(nametags) {
    this.nametags = nametags
  }

  draw(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const x = col * NAMETAG_WIDTH
    const y = row * NAMETAG_HEIGHT
    this.nametags.ctx.clearRect(x, y, NAMETAG_WIDTH, NAMETAG_HEIGHT)

    this.nametags.ctx.font = `800 ${NAME_FONT_SIZE}px Rubik`
    this.nametags.ctx.fillStyle = 'white'
    this.nametags.ctx.textAlign = 'center'
    this.nametags.ctx.textBaseline = 'top'
    this.nametags.ctx.lineWidth = NAME_OUTLINE_SIZE
    this.nametags.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    const text = this.fitText(nametag.name, NAMETAG_WIDTH)
    this.nametags.ctx.save()
    this.nametags.ctx.globalCompositeOperation = 'xor'
    this.nametags.ctx.globalAlpha = 1
    this.nametags.ctx.strokeText(text, x + NAMETAG_WIDTH / 2, y + 2 + 2)
    this.nametags.ctx.restore()
    this.nametags.ctx.fillText(text, x + NAMETAG_WIDTH / 2, y + 2 + 2)

    if (nametag.health < HEALTH_MAX) {
      {
        const fillStyle = 'rgba(0, 0, 0, 0.6)'
        const width = HEALTH_WIDTH
        const height = HEALTH_HEIGHT
        const left = x + (NAMETAG_WIDTH - HEALTH_WIDTH) / 2
        const top = y + NAME_FONT_SIZE + 5
        const borderRadius = HEALTH_BORDER_RADIUS
        fillRoundRect(this.nametags.ctx, left, top, width, height, borderRadius, fillStyle)
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
        fillRoundRect(this.nametags.ctx, left, top, width, height, borderRadius, fillStyle)
      }
    }
    this.nametags.texture.needsUpdate = true
  }

  fitText(text, maxWidth) {
    const width = this.nametags.ctx.measureText(text).width
    if (width <= maxWidth) {
      return text
    }
    const ellipsis = '...'
    let truncated = text
    const ellipsisWidth = this.nametags.ctx.measureText(ellipsis).width
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1)
      const truncatedWidth = this.nametags.ctx.measureText(truncated).width
      if (truncatedWidth + ellipsisWidth <= maxWidth) {
        return truncated + ellipsis
      }
    }
    return ellipsis
  }

  undraw(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / PER_ROW)
    const col = idx % PER_ROW
    const x = col * NAMETAG_WIDTH
    const y = row * NAMETAG_HEIGHT
    this.nametags.ctx.clearRect(x, y, NAMETAG_WIDTH, NAMETAG_HEIGHT)
    this.nametags.texture.needsUpdate = true
  }
}
