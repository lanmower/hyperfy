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

export class PostProcessingSetup {
  constructor(graphics) {
    this.graphics = graphics
    this.composer = null
    this.renderPass = null
    this.aoPass = null
    this.bloom = null
    this.smaa = null
    this.tonemapping = null
    this.effectPass = null
  }

  initialize(renderer, stage, camera, width, height, settings, prefs) {
    const context = renderer.getContext()
    const maxMultisampling = context.getParameter(context.MAX_SAMPLES)

    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
    })

    this.renderPass = new RenderPass(stage.scene, camera)
    this.composer.addPass(this.renderPass)

    this.aoPass = new N8AOPostPass(stage.scene, camera, width, height)
    this.aoPass.enabled = settings.get('ao') && prefs.state.get('ao')
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

    this.effectPass = new EffectPass(camera)
    this.updateEffects(prefs.state.get('bloom'))
    this.composer.addPass(this.effectPass)
  }

  updateEffects(bloomEnabled) {
    const effects = []
    if (bloomEnabled) {
      effects.push(this.bloom)
    }
    effects.push(this.smaa)
    effects.push(this.tonemapping)
    this.effectPass.setEffects(effects)
    this.effectPass.recompile()
  }

  setSize(width, height) {
    this.composer?.setSize(width, height)
  }

  render(renderer, usePostprocessing) {
    const isPresenting = renderer.xr.isPresenting
    if (isPresenting || !usePostprocessing) {
      return false
    }
    this.composer?.render()
    return true
  }
}
