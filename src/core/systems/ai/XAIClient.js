import { AIProviderConfig } from '../../../server/config/AIProviderConfig.js'
import { BaseAIClient } from './BaseAIClient.js'

export class XAIClient extends BaseAIClient {
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
