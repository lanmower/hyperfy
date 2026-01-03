import { OpenAI } from 'openai'
import { BaseAIClient } from './BaseAIClient.js'

export class OpenAIClient extends BaseAIClient {
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
