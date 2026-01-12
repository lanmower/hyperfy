import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('HUDOverlay')

export class HUDOverlay extends System {
  static DEPS = {
    entities: 'entities',
    network: 'network',
  }

  constructor(world) {
    super(world)
    this.hudElement = null
    this.statusElement = null
    this.controlsElement = null
  }

  init() {
    if (typeof document === 'undefined') return
    this.createHUD()
  }

  createHUD() {
    this.hudElement = document.createElement('div')
    this.hudElement.style.position = 'fixed'
    this.hudElement.style.top = '10px'
    this.hudElement.style.left = '10px'
    this.hudElement.style.color = 'white'
    this.hudElement.style.fontFamily = 'monospace'
    this.hudElement.style.fontSize = '12px'
    this.hudElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'
    this.hudElement.style.pointerEvents = 'none'
    this.hudElement.style.zIndex = '1001'

    this.statusElement = document.createElement('div')
    this.statusElement.style.marginBottom = '10px'
    this.statusElement.textContent = 'Hyperfy - Loading...'
    this.hudElement.appendChild(this.statusElement)

    this.controlsElement = document.createElement('div')
    this.controlsElement.style.fontSize = '11px'
    this.controlsElement.style.opacity = '0.8'
    this.controlsElement.innerHTML = `
      <div>WASD - Move</div>
      <div>Space - Jump</div>
      <div>Mouse - Look Around</div>
    `
    this.hudElement.appendChild(this.controlsElement)

    document.body.appendChild(this.hudElement)
    logger.info('HUD overlay created')
  }

  update(delta) {
    if (!this.statusElement) return

    const playerCount = this.entities.countPlayers()
    const appCount = this.entities.countApps()
    const connectionStatus = this.network.connected ? 'Connected' : 'Disconnected'

    this.statusElement.innerHTML = `
      <div>Players: ${playerCount} | Apps: ${appCount}</div>
      <div>Network: ${connectionStatus}</div>
      <div>FPS: ${Math.round(1 / (delta || 0.016))}</div>
    `
  }

  destroy() {
    if (this.hudElement && this.hudElement.parentElement) {
      this.hudElement.parentElement.removeChild(this.hudElement)
    }
  }
}
