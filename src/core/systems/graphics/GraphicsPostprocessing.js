import * as THREE from '../../extras/three.js'
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

export class GraphicsPostprocessing {
  constructor({ renderer, camera, scene, width, height, prefs, settings }) {
    this.renderer = renderer
    this.camera = camera
    this.scene = scene
    this.width = width
    this.height = height
    this.prefs = prefs
    this.settings = settings
    this.usePostprocessing = prefs.state.get('postprocessing')
    this.bloomEnabled = prefs.state.get('bloom')
  }

  init() {
    const context = this.renderer.getContext()
    const maxMultisampling = context.getParameter(context.MAX_SAMPLES)

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
    })

    this.renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(this.renderPass)

    this.aoPass = new N8AOPostPass(this.scene, this.camera, this.width, this.height)
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
    this.updateEffects()
    this.composer.addPass(this.effectPass)
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

  setPostprocessingEnabled(value) {
    this.usePostprocessing = value
  }

  setBloomEnabled(value) {
    this.bloomEnabled = value
    this.updateEffects()
  }

  setAOEnabled(value) {
    this.aoPass.enabled = value && this.settings.get('ao')
  }

  setAOFromSetting(value) {
    this.aoPass.enabled = value && this.prefs.state.get('ao')
  }

  resize(width, height) {
    this.width = width
    this.height = height
    this.composer.setSize(width, height)
  }

  render(isPresenting) {
    if (isPresenting || !this.usePostprocessing) {
      this.renderer.render(this.scene, this.camera)
    } else {
      this.composer.render()
    }
  }
}
