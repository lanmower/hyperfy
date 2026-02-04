import * as pc from '../extras/playcanvas.js'
import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('ClientGraphics')

export class ClientGraphics extends System {
  static DEPS = {
    camera: 'camera',
    events: 'events',
    stage: 'stage',
  }

  constructor(world) {
    super(world)
    this.app = null
    this.viewport = null
    this.pcCamera = null
    this.width = 0
    this.height = 0
    this.aspect = 1
    this.frameCount = 0
  }

  async init({ viewport }) {
    logger.info('ClientGraphics.init called')
    this.viewport = viewport
    this.width = viewport.offsetWidth || window.innerWidth
    this.height = viewport.offsetHeight || window.innerHeight
    this.aspect = this.width / this.height

    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    viewport.appendChild(canvas)

    this.app = new pc.Application(canvas, {
      mouse: new pc.Mouse(viewport),
      touch: new pc.Touch(viewport),
      keyboard: new pc.Keyboard(window),
      graphicsDeviceOptions: {
        alpha: false,
        antialias: true,
        powerPreference: 'high-performance'
      }
    })

    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO)

    if (typeof window !== 'undefined') {
      if (!window.pc) {
        window.pc = {}
        Object.assign(window.pc, pc)
      }
      window.pc.app = this.app
    }
    this.app.frame = 0

    const cameraEntity = new pc.Entity('camera')
    cameraEntity.addComponent('camera', {
      fov: 75,
      near: 0.1,
      far: 1000,
      clearColor: new pc.Color(0.3, 0.4, 0.6, 1),
      priority: 0
    })
    cameraEntity.setLocalPosition(0, 10, 0)
    this.app.root.addChild(cameraEntity)
    this.pcCamera = cameraEntity.camera
    this.app.scene.activeCameraEntity = cameraEntity

    logger.info('PlayCanvas app initialized (not yet started)', { width: this.width, height: this.height })

    window.addEventListener('resize', () => this.resize())
  }

  start() {
    logger.info('ClientGraphics.start called')
    this.startApp()
  }

  startApp() {
    logger.info('ClientGraphics.startApp called')
    if (!this.app) {
      logger.error('ClientGraphics.startApp: app is not initialized!')
      return
    }
    this.app.start()
    logger.info('PlayCanvas app created and ready for rendering')
  }

  resize() {
    this.width = this.viewport.offsetWidth || window.innerWidth
    this.height = this.viewport.offsetHeight || window.innerHeight
    this.aspect = this.width / this.height
    this.app.resizeCanvas(this.width, this.height)
    this.events.emit('graphicsResize', { width: this.width, height: this.height })
  }

  render() {
    this.frameCount++
    if (this.app) this.app.frame = this.frameCount
    const player = this.world.entities?.player
    if (player?.control?.camera && player.control.camera.write && player.cam) {
      const pcCameraEntity = this.pcCamera.entity
      pcCameraEntity.setLocalPosition(
        player.control.camera.position.x,
        player.control.camera.position.y,
        player.control.camera.position.z
      )
      pcCameraEntity.setLocalRotation(
        player.control.camera.quaternion.x,
        player.control.camera.quaternion.y,
        player.control.camera.quaternion.z,
        player.control.camera.quaternion.w
      )
    }
  }

  commit() {
    this.render()
    if (this.app) {
      this.app.render()
    }
  }

  preTick() {}

  destroy() {
    if (this.app) {
      this.app.destroy()
    }
    window.removeEventListener('resize', () => this.resize())
  }
}
