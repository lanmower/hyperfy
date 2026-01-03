import Anthropic from '@anthropic-ai/sdk'
import { BaseAIClient } from './BaseAIClient.js'

export class AnthropicClient extends BaseAIClient {
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
