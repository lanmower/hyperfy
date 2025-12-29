import fs from 'fs'
import path from 'path'
import Anthropic, { toFile } from '@anthropic-ai/sdk'
import { OpenAI } from 'openai'
import { fileURLToPath } from 'url'

import { AIProviderConfig } from '../../server/config/AIProviderConfig.js'
import { System } from './System.js'
import { hashFile } from '../utils-server.js'
import { ComponentLogger } from '../utils/logging/ComponentLogger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prefix = `app.remove(app.get('Block'))
`

const docs = fs.readFileSync(path.join(__dirname, '../client/public/ai-docs.md'), 'utf8')
const logger = new ComponentLogger('ServerAI')

export class ServerAI extends System {
  constructor(world) {
    super(world)
    this.assets = null
    this.provider = process.env.AI_PROVIDER || null
    this.model = process.env.AI_MODEL || null
    this.effort = process.env.AI_EFFORT || 'minimal'
    this.apiKey = process.env.AI_API_KEY || null
    if (this.provider && this.model && this.apiKey) {
      if (this.provider === 'openai') {
        this.client = new OpenAIClient(this.apiKey, this.model, this.effort)
      }
      if (this.provider === 'anthropic') {
        this.client = new AnthropicClient(this.apiKey, this.model)
      }
      if (this.provider === 'xai') {
        this.client = new XAIClient(this.apiKey, this.model)
      }
      if (this.provider === 'google') {
        this.client = new GoogleClient(this.apiKey, this.model)
      }
    }
    this.enabled = !!this.client
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
  }

  async onAction(action) {
    if (!this.enabled) {
      return
    }
    if (action.name === 'create') {
      this.create(action)
    } else if (action.name === 'edit') {
      this.edit(action)
    } else if (action.name === 'fix') {
      this.fix(action)
    }
  }

  async create({ blueprintId, appId, prompt }) {
    logger.info('creating...')
    this.classify({ blueprintId, prompt })
    const startAt = performance.now()
    let output = await this.client.create(prompt)
    output = stripCodeFences(output)
    const changelog = [`create: ${prompt}`]
    const code = prefix + writeChangelog(output, changelog)
    const elapsed = (performance.now() - startAt) / 1000
    logger.info(`created in ${elapsed}s`)
    const file = new File([code], 'script.js', { type: 'text/plain' })
    const fileContent = await file.arrayBuffer()
    const hash = await hashFile(Buffer.from(fileContent))
    const filename = `${hash}.js`
    const url = `asset://${filename}`
    await this.assets.upload(file)
    const blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, script: url }
    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)
  }

  async edit({ blueprintId, appId, prompt }) {
    logger.info('editing...')
    let blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) return logger.error('edit blueprint but blueprint not found')
    let script = this.world.loader.get('script', blueprint.script)
    if (!script) script = await this.world.loader.load('script', blueprint.script)
    const startAt = performance.now()
    const code = script.code.replace(prefix, '')
    const changelog = readChangelog(code)
    changelog.push(`edit: ${prompt}`)
    let output = await this.client.edit(code, prompt)
    output = stripCodeFences(output)
    const newCode = prefix + writeChangelog(output, changelog)
    const elapsed = (performance.now() - startAt) / 1000
    logger.info(`edited in ${elapsed}s`)
    const file = new File([newCode], 'script.js', { type: 'text/plain' })
    const fileContent = await file.arrayBuffer()
    const hash = await hashFile(Buffer.from(fileContent))
    const filename = `${hash}.js`
    const url = `asset://${filename}`
    await this.assets.upload(file)
    blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, script: url }
    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)
  }

  async fix({ blueprintId, appId, error }) {
    logger.info('fixing...')
    let blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) return logger.error('fix blueprint but blueprint not found')
    let script = this.world.loader.get('script', blueprint.script)
    if (!script) script = await this.world.loader.load('script', blueprint.script)
    const startAt = performance.now()
    const code = script.code.replace(prefix, '')
    const changelog = readChangelog(code)
    let output = await this.client.fix(code, error)
    output = stripCodeFences(output)
    const newCode = prefix + writeChangelog(output, changelog)
    const elapsed = (performance.now() - startAt) / 1000
    logger.info(`fixed in ${elapsed}s`)
    const file = new File([newCode], 'script.js', { type: 'text/plain' })
    const fileContent = await file.arrayBuffer()
    const hash = await hashFile(Buffer.from(fileContent))
    const filename = `${hash}.js`
    const url = `asset://${filename}`
    await this.assets.upload(file)
    blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, script: url }
    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)
  }

  async classify({ blueprintId, prompt }) {
    const name = await this.client.classify(prompt)
    const blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, name }
    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)
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
      this.logger.error(`${operation} error:`, err.message)
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
        instructions: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.`,
        input: `Respond with the javascript needed to generate the following:\n\n"${prompt}"`,
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
        instructions: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
          Here is the existing script that you will be working with:
          ===============
          ${code}`,
        input: `Please edit the code above to satisfy the following request:\n\n"${prompt}"`,
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
        instructions: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
          Here is the existing script that you will be working with:
          ===============
          ${code}`,
        input: `This code has an error please fix it:\n\n"${JSON.stringify(error, null, 2)}"`,
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
        instructions: `You are a classifier. We will give you a prompt that a user has entered to generate a 3D object and your job is respond with a short name for the object. For example if someone prompts "a cool gamer desk with neon lights" you would respond with something like "Gamer Desk" because it is a short descriptive name that captures the essence of the object.`,
        input: `Please classify the following prompt:\n\n"${prompt}"`,
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
      this.logger.error(`${operation} error:`, err.message)
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
        system: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.`,
        messages: [
          {
            role: 'user',
            content: `Respond with the javascript needed to generate the following:\n\n"${prompt}"`,
          },
        ],
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
        system: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
          Here is the existing script that you will be working with:
          ===============
          ${code}`,
        messages: [
          {
            role: 'user',
            content: `Please edit the code above to satisfy the following request:\n\n"${prompt}"`,
          },
        ],
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
        system: `
          ${docs}
          ===============
          You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
          Here is the existing script that you will be working with:
          ===============
          ${code}`,
        messages: [
          {
            role: 'user',
            content: `This code has an error please fix it:\n\n"${JSON.stringify(error, null, 2)}"`,
          },
        ],
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
        system: `You are a classifier. We will give you a prompt that a user has entered to generate a 3D object and your job is respond with a short name for the object. For example if someone prompts "a cool gamer desk with neon lights" you would respond with something like "Gamer Desk" because it is a short descriptive name that captures the essence of the object.`,
        messages: [
          {
            role: 'user',
            content: `Please classify the following prompt:\n\n"${prompt}"`,
          },
        ],
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
      this.logger.error(`${operation} error:`, err.message)
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
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        stream: false,
        messages,
      }),
    })
    if (!resp.ok) {
      throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse([
        {
          role: 'system',
          content: `
            ${docs}
            ===============
            You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.`,
        },
        {
          role: 'user',
          content: `Respond with the javascript needed to generate the following:\n\n"${prompt}"`,
        },
      ], 'create')
      this.validateResponse(data, 'create')
      return data.choices[0].message.content
    }, 'create')
  }

  async edit(code, prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse([
        {
          role: 'system',
          content: `
            ${docs}
            ===============
            You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
            Here is the existing script that you will be working with:
            ===============
            ${code}`,
        },
        {
          role: 'user',
          content: `Please edit the code above to satisfy the following request:\n\n"${prompt}"`,
        },
      ], 'edit')
      this.validateResponse(data, 'edit')
      return data.choices[0].message.content
    }, 'edit')
  }

  async fix(code, error) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse([
        {
          role: 'system',
          content: `
            ${docs}
            ===============
            You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
            Here is the existing script that you will be working with:
            ===============
            ${code}`,
        },
        {
          role: 'user',
          content: `This code has an error please fix it:\n\n"${JSON.stringify(error, null, 2)}"`,
        },
      ], 'fix')
      this.validateResponse(data, 'fix')
      return data.choices[0].message.content
    }, 'fix')
  }

  async classify(prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse([
        {
          role: 'system',
          content: `You are a classifier. We will give you a prompt that a user has entered to generate a 3D object and your job is respond with a short name for the object. For example if someone prompts "a cool gamer desk with neon lights" you would respond with something like "Gamer Desk" because it is a short descriptive name that captures the essence of the object.`,
        },
        {
          role: 'user',
          content: `Please classify the following prompt:\n\n"${prompt}"`,
        },
      ], 'classify')
      this.validateResponse(data, 'classify')
      return data.choices[0].message.content
    }, 'classify')
  }
}

class GoogleClient {
  constructor(apiKey, model) {
    this.apiKey = apiKey
    this.url = `${AIProviderConfig.providers.google.apiEndpoint}/v1beta/models/${model}:generateContent`
    this.logger = new ComponentLogger('Google')
  }

  async wrapCall(fn, operation) {
    try {
      return await fn()
    } catch (err) {
      this.logger.error(`${operation} error:`, err.message)
      throw err
    }
  }

  validateResponse(data, operation) {
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error(`${operation}: API returned empty candidates array`)
    }
    if (!data.candidates[0].content || !Array.isArray(data.candidates[0].content.parts) || data.candidates[0].content.parts.length === 0) {
      throw new Error(`${operation}: API response missing content.parts`)
    }
    if (!data.candidates[0].content.parts[0].text) {
      throw new Error(`${operation}: API response missing text field`)
    }
  }

  async fetchResponse(systemInstruction, userContent, operation) {
    const resp = await fetch(this.url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: {
            text: systemInstruction,
          },
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userContent }],
          },
        ],
      }),
    })
    if (!resp.ok) {
      throw new Error(`${operation}: API returned ${resp.status} ${resp.statusText}`)
    }
    return resp.json()
  }

  async create(prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse(`
        ${docs}
        ===============
        You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.`, `Respond with the javascript needed to generate the following:\n\n"${prompt}"`, 'create')
      this.validateResponse(data, 'create')
      return data.candidates[0].content.parts[0].text
    }, 'create')
  }

  async edit(code, prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse(`
        ${docs}
        ===============
        You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
        Here is the existing script that you will be working with:
        ===============
        ${code}`, `Please edit the code above to satisfy the following request:\n\n"${prompt}"`, 'edit')
      this.validateResponse(data, 'edit')
      return data.candidates[0].content.parts[0].text
    }, 'edit')
  }

  async fix(code, error) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse(`
        ${docs}
        ===============
        You are an artist and code generator. Always respond with raw code only, never use markdown code blocks or any other formatting.
        Here is the existing script that you will be working with:
        ===============
        ${code}`, `This code has an error please fix it:\n\n"${JSON.stringify(error, null, 2)}"`, 'fix')
      this.validateResponse(data, 'fix')
      return data.candidates[0].content.parts[0].text
    }, 'fix')
  }

  async classify(prompt) {
    return this.wrapCall(async () => {
      const data = await this.fetchResponse(`You are a classifier. We will give you a prompt that a user has entered to generate a 3D object and your job is respond with a short name for the object. For example if someone prompts "a cool gamer desk with neon lights" you would respond with something like "Gamer Desk" because it is a short descriptive name that captures the essence of the object.`, `Please classify the following prompt:\n\n"${prompt}"`, 'classify')
      this.validateResponse(data, 'classify')
      return data.candidates[0].content.parts[0].text
    }, 'classify')
  }
}

const changelogRegex = /\/\*\*[\s\S]*?changelog:[\s\S]*?\*\/\s*/
const entryRegex = /\*\s*-\s*(.+)/g

function readChangelog(code) {
  const match = code.match(changelogRegex)
  if (!match) return []
  const changelogBlock = match[0]
  const entries = []
  let entryMatch
  while ((entryMatch = entryRegex.exec(changelogBlock)) !== null) {
    entries.push(entryMatch[1].trim())
  }
  return entries
}

function writeChangelog(code, changelog) {
  const changelogRegex = /\/\*\*[\s\S]*?changelog:[\s\S]*?\*\/\s*/
  const cleanCode = code.replace(changelogRegex, '')
  const entries = changelog.map(entry => ` * - ${entry}`).join('\n')
  const header = `/**\n * changelog:\n${entries}\n */\n\n`
  return header + cleanCode.trimStart()
}

const fencePattern = /^```(?:\w+)?\s*([\s\S]*?)\s*```$/
function stripCodeFences(text) {
  let cleaned = text.trim()
  const match = cleaned.match(fencePattern)
  if (match) {
    return match[1]
  }
  return cleaned
}
