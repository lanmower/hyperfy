import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { PostProcessingSetup } from './graphics/PostProcessingSetup.js'
import { GraphicsConfiguration } from './graphics/GraphicsConfiguration.js'
import { RenderStateManager } from './graphics/RenderStateManager.js'
import { ViewportResizer } from './graphics/ViewportResizer.js'
import { XRGraphicsAdapter } from './graphics/XRGraphicsAdapter.js'

let gRenderer

function getRenderer() {
  if (!gRenderer) {
    gRenderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
    })
  }
  return gRenderer
}

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
    this.renderer = getRenderer()
    this.viewport = null
    this.renderState = new RenderStateManager()
    this.resizer = null
    this.xrAdapter = null
    this.usePostprocessing = false
    this.bloomEnabled = false
    this.postProcessing = new PostProcessingSetup(this)
    this.configuration = null
  }

  async init({ viewport }) {
    this.viewport = viewport
    this.renderer.setSize(viewport.offsetWidth, viewport.offsetHeight)
    this.maxAnisotropy = this.renderState.initialize(this.renderer, viewport, this.prefs.state.get('dpr'))
    this.renderState.initializeXR(this.renderer)
    this.viewport.appendChild(this.renderer.domElement)

    this.camera.aspect = this.renderState.aspect
    this.camera.updateProjectionMatrix()

    this.xrAdapter = new XRGraphicsAdapter(this.renderer, this.renderState)

    this.usePostprocessing = false
    this.bloomEnabled = false
    this.postProcessing.initialize(
      this.renderer, this.stage, this.camera,
      this.renderState.width, this.renderState.height,
      this.settings, this.prefs
    )

    this.configuration = new GraphicsConfiguration(this, this.postProcessing)
    this.configuration.setupPrefHandlers(this.renderer, this.settings, this.prefs)
    this.configuration.setupSettingHandlers(this.settings, this.prefs)

    this.resizer = new ViewportResizer(viewport, (w, h) => this.resize(w, h))
    this.resizer.start()
  }

  get width() { return this.renderState.width }
  get height() { return this.renderState.height }
  get aspect() { return this.renderState.aspect }
  get xrWidth() { return this.renderState.xrWidth }
  get xrHeight() { return this.renderState.xrHeight }
  get worldToScreenFactor() { return this.renderState.worldToScreenFactor }

  start() {}

  resize(width, height) {
    this.renderState.updateSize(width, height)
    this.camera.aspect = this.renderState.aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.postProcessing.setSize(width, height)
    this.events.emit('graphicsResize', { width, height })
    this.render()
  }

  render() {
    this.frameCount = (this.frameCount || 0) + 1
    if (!this.postProcessing.render(this.renderer, this.usePostprocessing)) {
      this.renderer.render(this.stage.scene, this.camera)
    }
    this.xrAdapter?.checkDimensions()
  }

  commit() {
    this.render()
  }

  preTick() {
    this.renderState.updateWorldToScreenFactor(this.camera)
  }

  onPrefChanged = ({ key, value }) => {
    this.configuration?.handlePrefChanged(key, value)
  }

  onXRSession = session => {
    this.renderState.handleXRSession(session)
  }

  onSettingChanged = ({ key, value }) => {
    this.configuration?.handleSettingChanged(key, value)
  }

  destroy() {
    this.resizer?.stop()
    this.viewport.removeChild(this.renderer.domElement)
  }
}
