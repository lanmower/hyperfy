import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { OpenAI } from 'openai'
import { AIProviderConfig } from '../../../server/config/AIProviderConfig.js'
import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('AIClientFactory')

export class AIClientFactory {
  static createClient(provider, apiKey, model, effort) {
    if (!provider || !model || !apiKey) {
      logger.warn('AI client creation skipped - missing configuration', { provider, hasModel: !!model, hasApiKey: !!apiKey })
      return null
    }

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
}

class OpenAIClient {
  constructor(apiKey, model, effort) {
    this.client = new OpenAI({ apiKey })
    this.model = model
    this.effort = effort
    this.logger = new ComponentLogger('OpenAI')
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
    if (!resp || !resp.output_text) {
      throw new Error(`${operation}: API response missing output_text field`)
    }
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.responses.create({
        model: this.model,
        reasoning: { effort: this.effort },
        instructions: prompt,
      })
      this.validateResponse(resp, 'create')
      return resp.output_text
    }, 'create')
  }

  async edit(code, prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.responses.create({
        model: this.model,
        reasoning: { effort: this.effort },
        instructions: prompt,
      })
      this.validateResponse(resp, 'edit')
      return resp.output_text
    }, 'edit')
  }

  async fix(code, error) {
    return this.wrapCall(async () => {
      const resp = await this.client.responses.create({
        model: this.model,
        reasoning: { effort: this.effort },
        instructions: prompt,
      })
      this.validateResponse(resp, 'fix')
      return resp.output_text
    }, 'fix')
  }

  async classify(prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.responses.create({
        model: this.model,
        reasoning: { effort: this.effort },
        instructions: prompt,
      })
      this.validateResponse(resp, 'classify')
      return resp.output_text
    }, 'classify')
  }
}

class AnthropicClient {
  constructor(apiKey, model) {
    this.client = new Anthropic({ apiKey })
    this.model = model
    this.maxTokens = 8192
    this.logger = new ComponentLogger('Anthropic')
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
    if (!resp.content || !Array.isArray(resp.content) || resp.content.length === 0) {
      throw new Error(`${operation}: API returned empty content array`)
    }
    if (!resp.content[0].text) {
      throw new Error(`${operation}: API response missing text field`)
    }
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: prompt.split('===============')[0].trim(),
        messages: [{ role: 'user', content: prompt.split('===============').pop().trim() }],
      })
      this.validateResponse(resp, 'create')
      return resp.content[0].text
    }, 'create')
  }

  async edit(code, prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: prompt.split('===============')[0].trim(),
        messages: [{ role: 'user', content: prompt.split('===============').pop().trim() }],
      })
      this.validateResponse(resp, 'edit')
      return resp.content[0].text
    }, 'edit')
  }

  async fix(code, error) {
    return this.wrapCall(async () => {
      const resp = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: prompt.split('===============')[0].trim(),
        messages: [{ role: 'user', content: prompt.split('===============').pop().trim() }],
      })
      this.validateResponse(resp, 'fix')
      return resp.content[0].text
    }, 'fix')
  }

  async classify(prompt) {
    return this.wrapCall(async () => {
      const resp = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: prompt.split('===============')[0].trim(),
        messages: [{ role: 'user', content: prompt.split('===============').pop().trim() }],
      })
      this.validateResponse(resp, 'classify')
      return resp.content[0].text
    }, 'classify')
  }
}

class XAIClient {
  constructor(apiKey, model) {
    this.apiKey = apiKey
    this.model = model
    this.url = AIProviderConfig.providers.xai.apiEndpoint + '/chat/completions'
    this.logger = new ComponentLogger('XAI')
  }

  async wrapCall(fn, operation) {
    try {
      return await fn()
    } catch (err) {
      this.logger.error(`${operation} error`, { error: err.message })
      throw err
    }
  }

  validateResponse(data, operation) {
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error(`${operation}: API returned empty choices array`)
    }
    if (!data.choices[0].message || !data.choices[0].message.content) {
      throw new Error(`${operation}: API response missing message.content field`)
    }
  }

  async fetchResponse(messages, operation) {
    const resp = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, stream: false, messages }),
    })
    if (!resp.ok) throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
    return resp.json()
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const messages = prompt.split('===============').map((p, i) => ({
        role: i === 0 ? 'system' : 'user',
        content: p.trim(),
      }))
      const data = await this.fetchResponse(messages, 'create')
      this.validateResponse(data, 'create')
      return data.choices[0].message.content
    }, 'create')
  }

  async edit(code, prompt) {
    return this.create(prompt)
  }

  async fix(code, error) {
    return this.create(error)
  }

  async classify(prompt) {
    return this.create(prompt)
  }
}

class GoogleClient {
  constructor(apiKey, model) {
    this.apiKey = apiKey
    this.model = model
    this.url = AIProviderConfig.providers.google.apiEndpoint
    this.logger = new ComponentLogger('Google')
  }

  async wrapCall(fn, operation) {
    try {
      return await fn()
    } catch (err) {
      this.logger.error(`${operation} error`, { error: err.message })
      throw err
    }
  }

  validateResponse(data, operation) {
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`${operation}: API returned empty candidates array`)
    }
    if (!data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
      throw new Error(`${operation}: API response missing content.parts field`)
    }
  }

  async fetchResponse(systemInstruction, userContent, operation) {
    const resp = await fetch(this.url, {
      method: 'POST',
      headers: { 'x-goog-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: systemInstruction } },
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
      }),
    })
    if (!resp.ok) throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
    return resp.json()
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const [system, user] = prompt.split('===============').map(p => p.trim())
      const data = await this.fetchResponse(system, user, 'create')
      this.validateResponse(data, 'create')
      return data.candidates[0].content.parts[0].text
    }, 'create')
  }

  async edit(code, prompt) {
    return this.create(prompt)
  }

  async fix(code, error) {
    return this.create(error)
  }

  async classify(prompt) {
    return this.create(prompt)
  }
}
