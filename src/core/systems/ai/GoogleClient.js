import { AIProviderConfig } from '../../../server/config/AIProviderConfig.js'
import { BaseAIClient } from './BaseAIClient.js'

export class GoogleClient extends BaseAIClient {
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
