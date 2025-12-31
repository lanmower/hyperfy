// AI client factory with provider abstraction
import Anthropic from '@anthropic-ai/sdk'
import { OpenAI } from 'openai'
import { AIProviderConfig } from '../../../server/config/AIProviderConfig.js'
import { BaseFactory } from '../../patterns/BaseFactory.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AIClientFactory')

class BaseAIClient {
  constructor(name) {
    this.logger = new StructuredLogger(name)
  }

  async wrapCall(fn, operation) {
    try {
      return await fn()
    } catch (err) {
      this.logger.error(`${operation} error`, { error: err.message })
      throw err
    }
  }

  validateResponse(resp, operation) {
    if (!resp) throw new Error(`${operation}: API returned empty response`)
  }
}

class OpenAIClient extends BaseAIClient {
  constructor(apiKey, model, effort) {
    super('OpenAI')
    this.client = new OpenAI({ apiKey })
    this.model = model
    this.effort = effort
  }

  validateResponse(resp, operation) {
    if (!resp || !resp.output_text) {
      throw new Error(`${operation}: API response missing output_text field`)
    }
  }

  async _apiCall(prompt, operation) {
    return this.wrapCall(async () => {
      const resp = await this.client.responses.create({
        model: this.model,
        reasoning: { effort: this.effort },
        instructions: prompt,
      })
      this.validateResponse(resp, operation)
      return resp.output_text
    }, operation)
  }

  async create(prompt) { return this._apiCall(prompt, 'create') }
  async edit(code, prompt) { return this._apiCall(prompt, 'edit') }
  async fix(code, error) { return this._apiCall(error, 'fix') }
  async classify(prompt) { return this._apiCall(prompt, 'classify') }
}

class AnthropicClient extends BaseAIClient {
  constructor(apiKey, model) {
    super('Anthropic')
    this.client = new Anthropic({ apiKey })
    this.model = model
    this.maxTokens = 8192
  }

  validateResponse(resp, operation) {
    if (!Array.isArray(resp.content)?.length) {
      throw new Error(`${operation}: API returned empty content array`)
    }
    if (!resp.content[0].text) {
      throw new Error(`${operation}: API response missing text field`)
    }
  }

  async _apiCall(prompt, operation) {
    return this.wrapCall(async () => {
      const [system, user] = prompt.split('===============').map(p => p.trim())
      const resp = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      })
      this.validateResponse(resp, operation)
      return resp.content[0].text
    }, operation)
  }

  async create(prompt) { return this._apiCall(prompt, 'create') }
  async edit(code, prompt) { return this._apiCall(prompt, 'edit') }
  async fix(code, error) { return this._apiCall(error, 'fix') }
  async classify(prompt) { return this._apiCall(prompt, 'classify') }
}

class XAIClient extends BaseAIClient {
  constructor(apiKey, model) {
    super('XAI')
    this.apiKey = apiKey
    this.model = model
    this.url = AIProviderConfig.providers.xai.apiEndpoint + '/chat/completions'
  }

  validateResponse(data, operation) {
    if (!Array.isArray(data.choices)?.length) {
      throw new Error(`${operation}: API returned empty choices array`)
    }
    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error(`${operation}: API response missing message.content field`)
    }
  }

  async _apiCall(prompt, operation) {
    return this.wrapCall(async () => {
      const messages = prompt.split('===============').map((p, i) => ({
        role: i === 0 ? 'system' : 'user',
        content: p.trim(),
      }))
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, stream: false, messages }),
      })
      if (!resp.ok) throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
      const data = await resp.json()
      this.validateResponse(data, operation)
      return data.choices[0].message.content
    }, operation)
  }

  async create(prompt) { return this._apiCall(prompt, 'create') }
  async edit(code, prompt) { return this._apiCall(prompt, 'edit') }
  async fix(code, error) { return this._apiCall(error, 'fix') }
  async classify(prompt) { return this._apiCall(prompt, 'classify') }
}

class GoogleClient extends BaseAIClient {
  constructor(apiKey, model) {
    super('Google')
    this.apiKey = apiKey
    this.model = model
    this.url = AIProviderConfig.providers.google.apiEndpoint
  }

  validateResponse(data, operation) {
    if (!Array.isArray(data.candidates)?.length) {
      throw new Error(`${operation}: API returned empty candidates array`)
    }
    if (!Array.isArray(data.candidates[0].content?.parts)?.length) {
      throw new Error(`${operation}: API response missing content.parts field`)
    }
  }

  async _apiCall(prompt, operation) {
    return this.wrapCall(async () => {
      const [system, user] = prompt.split('===============').map(p => p.trim())
      const resp = await fetch(this.url, {
        method: 'POST',
        headers: { 'x-goog-api-key': this.apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: { text: system } },
          contents: [{ role: 'user', parts: [{ text: user }] }],
        }),
      })
      if (!resp.ok) throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
      const data = await resp.json()
      this.validateResponse(data, operation)
      return data.candidates[0].content.parts[0].text
    }, operation)
  }

  async create(prompt) { return this._apiCall(prompt, 'create') }
  async edit(code, prompt) { return this._apiCall(prompt, 'edit') }
  async fix(code, error) { return this._apiCall(error, 'fix') }
  async classify(prompt) { return this._apiCall(prompt, 'classify') }
}

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
