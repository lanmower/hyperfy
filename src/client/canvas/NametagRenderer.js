import * as pc from '../../core/extras/playcanvas.js'
import { fillRoundRect } from '../../core/extras/roundRect.js'
import * as Config from '../../core/config/NametagConfig.js'

export class NametagRenderer {
  constructor(graphicsDevice) {
    const domCanvas = document.createElement('canvas')
    domCanvas.width = Config.WIDTH * Config.GRID_COLS
    domCanvas.height = Config.HEIGHT * Config.GRID_ROWS
    this.canvas = domCanvas
    this.ctx = domCanvas.getContext('2d')
    this.gd = graphicsDevice
    this.texture = new pc.Texture(graphicsDevice, {
      width: domCanvas.width,
      height: domCanvas.height,
      format: pc.PIXELFORMAT_R8_G8_B8_A8,
      autoMipmap: true
    })
  }

  draw(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / Config.GRID_COLS)
    const col = idx % Config.GRID_COLS
    const x = col * Config.WIDTH
    const y = row * Config.HEIGHT
    this.ctx.clearRect(x, y, Config.WIDTH, Config.HEIGHT)
    this.ctx.font = `800 ${Config.NAME_FONT_SIZE}px Rubik`
    this.ctx.fillStyle = 'white'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.lineWidth = Config.NAME_OUTLINE_SIZE
    this.ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    const text = this.fitText(nametag.name, Config.WIDTH)
    const textX = x + Config.WIDTH / 2
    const textY = y + 4
    this.ctx.save()
    this.ctx.globalCompositeOperation = 'xor'
    this.ctx.globalAlpha = 1
    this.ctx.strokeText(text, textX, textY)
    this.ctx.restore()
    this.ctx.fillText(text, textX, textY)
    if (nametag.health < Config.HEALTH_MAX) {
      const healthLeft = x + (Config.WIDTH - Config.HEALTH_WIDTH) / 2
      const healthTop = y + Config.NAME_FONT_SIZE + 5
      fillRoundRect(this.ctx, healthLeft, healthTop, Config.HEALTH_WIDTH, Config.HEALTH_HEIGHT, Config.HEALTH_BORDER_RADIUS, 'rgba(0, 0, 0, 0.6)')
      const perc = nametag.health / Config.HEALTH_MAX
      const barWidth = (Config.HEALTH_WIDTH - Config.HEALTH_BORDER * 2) * perc
      fillRoundRect(this.ctx, healthLeft + Config.HEALTH_BORDER, healthTop + Config.HEALTH_BORDER, barWidth, Config.HEALTH_HEIGHT - Config.HEALTH_BORDER * 2, Config.HEALTH_BORDER_RADIUS, '#229710')
    }
    this.texture.setSource(this.canvas)
  }

  fitText(text, maxWidth) {
    const width = this.ctx.measureText(text).width
    if (width <= maxWidth) return text
    const ellipsis = '...'
    let truncated = text
    const ellipsisWidth = this.ctx.measureText(ellipsis).width
    while (truncated.length > 0) {
      truncated = truncated.slice(0, -1)
      const truncatedWidth = this.ctx.measureText(truncated).width
      if (truncatedWidth + ellipsisWidth <= maxWidth) return truncated + ellipsis
    }
    return ellipsis
  }

  clear(nametag) {
    const idx = nametag.idx
    const row = Math.floor(idx / Config.GRID_COLS)
    const col = idx % Config.GRID_COLS
    const x = col * Config.WIDTH
    const y = row * Config.HEIGHT
    this.ctx.clearRect(x, y, Config.WIDTH, Config.HEIGHT)
    this.texture.setSource(this.canvas)
  }
}
