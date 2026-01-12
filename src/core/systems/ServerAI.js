import { System } from './System.js'
import { StructuredLogger } from '../utils/logging/index.js'
import { AIClientFactory } from './ai/AIClientFactory.js'
import { AIFunctionCaller } from './ai/AIFunctionCaller.js'
import { PromptBuilder } from './ai/PromptBuilder.js'
import { ScriptOperationOrchestrator } from './ai/ScriptOperationOrchestrator.js'

const logger = new StructuredLogger('ServerAI')

export class ServerAI extends System {
  constructor(world) {
    super(world)
    this.assets = null
    this.provider = process.env.AI_PROVIDER || null
    this.model = process.env.AI_MODEL || null
    this.effort = process.env.AI_EFFORT || 'minimal'
    this.apiKey = process.env.AI_API_KEY || null

    const client = AIClientFactory.createClient(this.provider, this.apiKey, this.model, this.effort)
    this.enabled = !!client

    if (this.enabled) {
      this.aiCaller = new AIFunctionCaller(client)
      this.promptBuilder = new PromptBuilder()
      this.orchestrator = null
    }
  }

  serialize() {
    return {
      enabled: this.enabled,
      provider: this.provider,
      model: this.model,
      effort: this.effort,
    }
  }

  async init({ assets }) {
    this.assets = assets
    if (this.enabled) {
      this.orchestrator = new ScriptOperationOrchestrator(this.world, this.aiCaller)
      logger.info('ServerAI initialized', { provider: this.provider, model: this.model })
    }
  }

  async onAction(action) {
    if (!this.enabled) {
      return
    }
    if (action.name === 'create') {
      await this.create(action)
    } else if (action.name === 'edit') {
      await this.edit(action)
    } else if (action.name === 'fix') {
      await this.fix(action)
    }
  }

  async create({ blueprintId, appId, prompt }) {
    const fullPrompt = this.promptBuilder.buildCreatePrompt(prompt)
    await this.orchestrator.create(blueprintId, fullPrompt)
  }

  async edit({ blueprintId, appId, prompt }) {
    const blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) {
      logger.error('Blueprint not found for edit', { blueprintId })
      return
    }
    let script = this.world.loader.get('script', blueprint.script)
    if (!script) {
      script = await this.world.loader.load('script', blueprint.script)
    }
    const fullPrompt = this.promptBuilder.buildEditPrompt(script.code, prompt)
    await this.orchestrator.edit(blueprintId, fullPrompt)
  }

  async fix({ blueprintId, appId, error }) {
    const blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) {
      logger.error('Blueprint not found for fix', { blueprintId })
      return
    }
    let script = this.world.loader.get('script', blueprint.script)
    if (!script) {
      script = await this.world.loader.load('script', blueprint.script)
    }
    const fullPrompt = this.promptBuilder.buildFixPrompt(script.code, error)
    await this.orchestrator.fix(blueprintId, fullPrompt)
  }
}
