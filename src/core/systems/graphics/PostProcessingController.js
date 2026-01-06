import { PostProcessingSetup } from './PostProcessingSetup.js'
import { System } from '../System.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('PostProcessingController')

export class PostProcessingController extends System {
  static DEPS = {
    graphics: 'graphics',
    events: 'events'
  }

  constructor(world) {
    super(world)
    this.postProcessing = null
  }

  async init() {
    try {
      await this.waitForGraphics()

      const camera = this.graphics.pcCamera
      const app = this.graphics.app

      if (!camera || !app) {
        logger.warn('No camera or app found, post-processing disabled')
        return
      }

      this.postProcessing = new PostProcessingSetup(app, camera)
      this.postProcessing.init()

      this.postProcessing.loadSettings({
        bloom: {
          intensity: 0.5,
          threshold: 0.5,
          blurAmount: 4
        },
        ssao: {
          radius: 2.0,
          samples: 8,
          intensity: 1.0
        },
        fxaa: true
      })

      logger.info('Post-processing initialized', {
        effects: Object.keys(this.postProcessing.effects)
      })
    } catch (err) {
      logger.error('Failed to initialize post-processing', {
        error: err.message,
        stack: err.stack
      })
    }
  }

  async waitForGraphics(timeout = 5000) {
    const start = Date.now()
    while (!this.graphics.app || !this.graphics.pcCamera) {
      if (Date.now() - start > timeout) {
        throw new Error('Graphics system initialization timeout')
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  start() {
    if (this.events) {
      this.events.on('graphicsResize', this.handleResize.bind(this))
    }
  }

  handleResize({ width, height }) {
    if (this.postProcessing) {
      logger.debug('Post-processing resize', { width, height })
    }
  }

  getEffect(name) {
    return this.postProcessing?.effects[name]
  }

  setBloomIntensity(intensity) {
    this.postProcessing?.setBloomIntensity(intensity)
  }

  setBloomThreshold(threshold) {
    this.postProcessing?.setBloomThreshold(threshold)
  }

  setBloomBlurAmount(amount) {
    this.postProcessing?.setBloomBlurAmount(amount)
  }

  setSSAORadius(radius) {
    this.postProcessing?.setSSAORadius(radius)
  }

  setSSAOSamples(samples) {
    this.postProcessing?.setSSAOSamples(samples)
  }

  setSSAOIntensity(intensity) {
    this.postProcessing?.setSSAOIntensity(intensity)
  }

  toggleFXAA(enabled) {
    this.postProcessing?.setFXAAEnabled(enabled)
  }

  getSettings() {
    return this.postProcessing?.getSettings()
  }

  setSettings(settings) {
    if (this.postProcessing) {
      this.postProcessing.loadSettings(settings)
    }
  }

  serialize() {
    return this.postProcessing?.serialize()
  }
}
