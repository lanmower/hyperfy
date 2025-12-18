import { System } from './System.js'
import { GraphicsRenderer } from './graphics/GraphicsRenderer.js'
import { GraphicsPostprocessing } from './graphics/GraphicsPostprocessing.js'
import { GraphicsXR } from './graphics/GraphicsXR.js'

export class ClientGraphics extends System {
  static DEPS = {
    camera: 'camera',
    prefs: 'prefs',
    events: 'events',
    stage: 'stage',
    settings: 'settings',
  }

  static EVENTS = {
    prefChanged: 'onPrefChanged',
    xrSession: 'onXRSession',
    settingChanged: 'onSettingChanged',
  }

  constructor(world) {
    super(world)
  }

  async init({ viewport }) {
    this.viewport = viewport

    this.rendererModule = new GraphicsRenderer({
      viewport,
      prefs: this.prefs,
    })
    this.rendererModule.init()
    this.renderer = this.rendererModule.renderer
    this.width = this.rendererModule.width
    this.height = this.rendererModule.height
    this.aspect = this.rendererModule.aspect
    this.maxAnisotropy = this.rendererModule.maxAnisotropy

    this.xrModule = new GraphicsXR({
      renderer: this.renderer,
    })
    this.xrModule.init()

    this.postprocessingModule = new GraphicsPostprocessing({
      renderer: this.renderer,
      camera: this.camera,
      scene: this.stage.scene,
      width: this.width,
      height: this.height,
      prefs: this.prefs,
      settings: this.settings,
    })
    this.postprocessingModule.init()
    this.composer = this.postprocessingModule.composer

    this.rendererModule.setupResizeObserver((width, height) => {
      this.resize(width, height)
    })

    this.setupPrefRegistry()
    this.setupSettingRegistry()
  }

  setupPrefRegistry() {
    this.prefHandlers = {
      'dpr': (value) => {
        this.rendererModule.setDPR(value)
        this.resize(this.width, this.height)
      },
      'postprocessing': (value) => {
        this.postprocessingModule.setPostprocessingEnabled(value)
      },
      'bloom': (value) => {
        this.postprocessingModule.setBloomEnabled(value)
      },
      'ao': (value) => {
        this.postprocessingModule.setAOEnabled(value)
      },
    }
  }

  setupSettingRegistry() {
    this.settingHandlers = {
      'ao': (value) => {
        this.postprocessingModule.setAOFromSetting(value)
      },
    }
  }

  start() {
  }

  resize(width, height) {
    this.rendererModule.resize(width, height, this.camera)
    this.width = this.rendererModule.width
    this.height = this.rendererModule.height
    this.aspect = this.rendererModule.aspect
    this.postprocessingModule.resize(width, height)
    this.events.emit('graphicsResize', { width, height })
    this.render()
  }

  render() {
    this.postprocessingModule.render(this.xrModule.isPresenting())
    if (this.xrModule.needsDimensionCheck()) {
      this.xrModule.checkDimensions()
    }
  }

  commit() {
    this.render()
  }

  preTick() {
    const camera = this.camera
    const fovRadians = camera.fov * (Math.PI / 180)
    const rendererHeight = this.xrModule.getHeight() || this.height
    this.worldToScreenFactor = (Math.tan(fovRadians / 2) * 2) / rendererHeight
  }

  onPrefChanged = ({ key, value }) => {
    const handler = this.prefHandlers[key]
    if (handler) handler(value)
  }

  onXRSession = session => {
    this.xrModule.onSessionChange(session)
  }


  onSettingChanged = ({ key, value }) => {
    const handler = this.settingHandlers[key]
    if (handler) handler(value)
  }

  destroy() {
    this.rendererModule.destroy()
  }
}
