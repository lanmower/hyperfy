export class ViewportResizer {
  constructor(viewport, onResize) {
    this.viewport = viewport
    this.onResize = onResize
    this.resizer = null
  }

  start() {
    this.resizer = new ResizeObserver(() => {
      const width = this.viewport.offsetWidth
      const height = this.viewport.offsetHeight
      this.onResize(width, height)
    })
    this.resizer.observe(this.viewport)
  }

  stop() {
    if (this.resizer) {
      this.resizer.disconnect()
      this.resizer = null
    }
  }
}
