import { OpenAIClient } from './OpenAIClient.js'
import { AnthropicClient } from './AnthropicClient.js'
import { XAIClient } from './XAIClient.js'
import { GoogleClient } from './GoogleClient.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AIClientFactory')

export class AIClientFactory extends BaseFactory {
  static create(config) {
    this.validate(config)
    const { provider, apiKey, model, effort } = config

    switch (provider) {
      case 'openai':
        logger.debug('Creating OpenAI client', { model })
        return new OpenAIClient(apiKey, model, effort)
      case 'anthropic':
        logger.debug('Creating Anthropic client', { model })
        return new AnthropicClient(apiKey, model)
      case 'xai':
        logger.debug('Creating XAI client', { model })
        return new XAIClient(apiKey, model)
      case 'google':
        logger.debug('Creating Google client', { model })
        return new GoogleClient(apiKey, model)
      default:
        logger.warn('Unknown AI provider', { provider })
        return null
    }
  }

  static validate(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('AIClientFactory config must be an object')
    }
    if (!config.provider || !config.apiKey || !config.model) {
      logger.warn('AI client creation skipped - missing configuration', {
        provider: config.provider,
        hasModel: !!config.model,
        hasApiKey: !!config.apiKey
      })
    }
  }

  static createClient(provider, apiKey, model, effort) {
    return this.create({ provider, apiKey, model, effort })
  }
}
