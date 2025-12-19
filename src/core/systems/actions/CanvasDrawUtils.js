export const CanvasDrawUtils = {
  drawBox(ctx, pr, x, y, width, height, radius, color) {
    x *= pr; y *= pr; width *= pr; height *= pr; radius *= pr
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

  drawCircle(ctx, pr, x, y, radius, color) {
    x *= pr; y *= pr; radius *= pr
    const centerX = x + radius, centerY = y + radius
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
  },

  drawPie(ctx, pr, x, y, radius, percent, color, offset = 0) {
    x *= pr; y *= pr; radius *= pr
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

  measureText(ctx, pr, x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
    fontSize *= pr
    ctx.font = `${fontWeight} ${fontSize}px ${font}`
    const metrics = ctx.measureText(text)
    return { width: metrics.width / pr }
  },

  drawText(ctx, pr, x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
    x *= pr; y *= pr; fontSize *= pr
    ctx.fillStyle = color
    ctx.font = `${fontWeight} ${fontSize}px ${font}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(text, x, y)
  }
}
