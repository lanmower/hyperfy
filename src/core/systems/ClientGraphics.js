import * as THREE from '../extras/three.js'
import { N8AOPostPass } from 'n8ao'
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  SMAAPreset,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BloomEffect,
  BlendFunction,
} from 'postprocessing'

import { System } from './System.js'

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

    const context = this.renderer.getContext()
    const maxMultisampling = context.getParameter(context.MAX_SAMPLES)

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    })

    this.renderPass = new RenderPass(this.stage.scene, this.camera)
    this.composer.addPass(this.renderPass)

    this.aoPass = new N8AOPostPass(this.stage.scene, this.camera, this.width, this.height)
    this.aoPass.enabled = this.settings.get('ao') && this.prefs.state.get('ao')
    this.aoPass.autoDetectTransparency = false
    this.aoPass.configuration.halfRes = true
    this.aoPass.configuration.screenSpaceRadius = true
    this.aoPass.configuration.aoRadius = 32
    this.aoPass.configuration.distanceFalloff = 1
    this.aoPass.configuration.intensity = 2
    this.composer.addPass(this.aoPass)

    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      mipmapBlur: true,
      luminanceThreshold: 1,
      luminanceSmoothing: 0.3,
      intensity: 0.5,
      radius: 0.8,
    })

    this.smaa = new SMAAEffect({ preset: SMAAPreset.ULTRA })
    this.tonemapping = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })

    this.effectPass = new EffectPass(this.camera)
    this.usePostprocessing = this.prefs.state.get('postprocessing')
    this.bloomEnabled = this.prefs.state.get('bloom')
    this.updateEffects()
    this.composer.addPass(this.effectPass)

    this.setupResizeObserver((width, height) => {
      this.resize(width, height)
    })

    this.setupPrefRegistry()
    this.setupSettingRegistry()
  }

  updateEffects() {
    const effects = []
    if (this.bloomEnabled) {
      effects.push(this.bloom)
    }
    effects.push(this.smaa)
    effects.push(this.tonemapping)
    this.effectPass.setEffects(effects)
    this.effectPass.recompile()
  }

  setupResizeObserver(callback) {
    this.resizer = new ResizeObserver(() => {
      callback(this.viewport.offsetWidth, this.viewport.offsetHeight)
    })
    this.resizer.observe(this.viewport)
  }

  setupPrefRegistry() {
    this.prefHandlers = {
      'dpr': (value) => {
        this.renderer.setPixelRatio(value)
        this.resize(this.width, this.height)
      },
      'postprocessing': (value) => {
        this.usePostprocessing = value
      },
      'bloom': (value) => {
        this.bloomEnabled = value
        this.updateEffects()
      },
      'ao': (value) => {
        this.aoPass.enabled = value && this.settings.get('ao')
      },
    }
  }

  setupSettingRegistry() {
    this.settingHandlers = {
      'ao': (value) => {
        this.aoPass.enabled = value && this.prefs.state.get('ao')
      },
    }
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
    this.composer.setSize(width, height)
    this.events.emit('graphicsResize', { width, height })
    this.render()
  }

  render() {
    const isPresenting = this.renderer.xr.isPresenting
    if (isPresenting || !this.usePostprocessing) {
      this.renderer.render(this.stage.scene, this.camera)
    } else {
      this.composer.render()
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
    const handler = this.prefHandlers[key]
    if (handler) handler(value)
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
    const handler = this.settingHandlers[key]
    if (handler) handler(value)
  }

  destroy() {
    if (this.resizer) {
      this.resizer.disconnect()
    }
    this.viewport.removeChild(this.renderer.domElement)
  }
}
