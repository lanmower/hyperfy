import * as THREE from '../extras/three.js'
import { System } from './System.js'
import { PostProcessingSetup } from './graphics/PostProcessingSetup.js'
import { GraphicsConfiguration } from './graphics/GraphicsConfiguration.js'

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
    this.resizer = null
    this.xrSession = null
    this.xrWidth = null
    this.xrHeight = null
    this.xrDimensionsNeeded = false
    this.usePostprocessing = false
    this.bloomEnabled = false
    this.postProcessing = new PostProcessingSetup(this)
    this.configuration = null
  }

  async init({ viewport }) {
    this.viewport = viewport

    this.renderer.setSize(viewport.offsetWidth, viewport.offsetHeight)
    this.renderer.setClearColor(0xffffff, 0)
    this.renderer.setPixelRatio(this.prefs.state.get('dpr'))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.toneMappingExposure = 1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()
    THREE.Texture.DEFAULT_ANISOTROPY = this.maxAnisotropy
    this.viewport.appendChild(this.renderer.domElement)

    this.width = viewport.offsetWidth
    this.height = viewport.offsetHeight
    this.aspect = this.width / this.height

    this.renderer.xr.enabled = true
    this.renderer.xr.setReferenceSpaceType('local-floor')
    this.renderer.xr.setFoveation(1)

    this.usePostprocessing = this.prefs.state.get('postprocessing')
    this.bloomEnabled = this.prefs.state.get('bloom')
    this.postProcessing.initialize(this.renderer, this.stage, this.camera, this.width, this.height, this.settings, this.prefs)

    this.configuration = new GraphicsConfiguration(this, this.postProcessing)
    this.configuration.setupPrefHandlers(this.renderer, this.settings, this.prefs)
    this.configuration.setupSettingHandlers(this.settings, this.prefs)

    this.setupResizeObserver((width, height) => {
      this.resize(width, height)
    })
  }

  setupResizeObserver(callback) {
    this.resizer = new ResizeObserver(() => {
      callback(this.viewport.offsetWidth, this.viewport.offsetHeight)
    })
    this.resizer.observe(this.viewport)
  }

  start() {
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.aspect = this.width / this.height
    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
    this.postProcessing.setSize(width, height)
    this.events.emit('graphicsResize', { width, height })
    this.render()
  }

  render() {
    const isPresenting = this.renderer.xr.isPresenting
    if (!this.postProcessing.render(this.renderer, this.usePostprocessing)) {
      this.renderer.render(this.stage.scene, this.camera)
    }
    if (this.xrDimensionsNeeded) {
      this.checkXRDimensions()
    }
  }

  checkXRDimensions() {
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    const frame = this.renderer.xr.getFrame()
    if (frame && referenceSpace) {
      const views = frame.getViewerPose(referenceSpace)?.views
      if (views && views.length > 0) {
        const projectionMatrix = views[0].projectionMatrix
        const fovFactor = projectionMatrix[5]
        const renderState = this.xrSession.renderState
        const baseLayer = renderState.baseLayer
        if (baseLayer) {
          this.xrWidth = baseLayer.framebufferWidth
          this.xrHeight = baseLayer.framebufferHeight
          this.xrDimensionsNeeded = false
          console.log({ xrWidth: this.xrWidth, xrHeight: this.xrHeight })
        }
      }
    }
  }

  commit() {
    this.render()
  }

  preTick() {
    const camera = this.camera
    const fovRadians = camera.fov * (Math.PI / 180)
    const rendererHeight = this.xrHeight || this.height
    this.worldToScreenFactor = (Math.tan(fovRadians / 2) * 2) / rendererHeight
  }

  onPrefChanged = ({ key, value }) => {
    this.configuration?.handlePrefChanged(key, value)
  }

  onXRSession = session => {
    if (session) {
      this.xrSession = session
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = true
    } else {
      this.xrSession = null
      this.xrWidth = null
      this.xrHeight = null
      this.xrDimensionsNeeded = false
    }
  }

  onSettingChanged = ({ key, value }) => {
    this.configuration?.handleSettingChanged(key, value)
  }

  destroy() {
    if (this.resizer) {
      this.resizer.disconnect()
    }
    this.viewport.removeChild(this.renderer.domElement)
  }
}
