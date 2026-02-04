import { File } from 'buffer'
import { hashFile } from '../../utils-server.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('ScriptOperationOrchestrator')

const PREFIX = `app.remove(app.get('Block'))\n`

export class ScriptOperationOrchestrator {
  constructor(world, aiCaller) {
    this.world = world
    this.aiCaller = aiCaller
  }

  async _loadBlueprintScript(blueprintId) {
    const blueprint = this.world.blueprints.get(blueprintId)
    if (!blueprint) {
      logger.error('Blueprint not found', { blueprintId })
      return null
    }

    let script = this.world.loader.get('script', blueprint.script)
    if (!script) {
      script = await this.world.loader.load('script', blueprint.script)
    }

    return { blueprint, script }
  }

  async create(blueprintId, prompt) {
    logger.info('Script create operation started', { blueprintId })

    this.classify(blueprintId, prompt)

    const aiResponse = await this.aiCaller.create(prompt)
    const cleanedCode = stripCodeFences(aiResponse)
    const changelog = [`create: ${prompt}`]
    const code = PREFIX + writeChangelog(cleanedCode, changelog)

    await this.uploadAndUpdateBlueprint(blueprintId, code, changelog)
    logger.info('Script create operation completed', { blueprintId })
  }

  async edit(blueprintId, prompt) {
    logger.info('Script edit operation started', { blueprintId })

    const result = await this._loadBlueprintScript(blueprintId)
    if (!result) return

    const code = result.script.code.replace(PREFIX, '')
    const changelog = readChangelog(code)
    changelog.push(`edit: ${prompt}`)

    const aiResponse = await this.aiCaller.edit(code, prompt)
    const cleanedCode = stripCodeFences(aiResponse)
    const newCode = PREFIX + writeChangelog(cleanedCode, changelog)

    await this.uploadAndUpdateBlueprint(blueprintId, newCode, changelog)
    logger.info('Script edit operation completed', { blueprintId })
  }

  async fix(blueprintId, error) {
    logger.info('Script fix operation started', { blueprintId })

    const result = await this._loadBlueprintScript(blueprintId)
    if (!result) return

    const code = result.script.code.replace(PREFIX, '')
    const changelog = readChangelog(code)

    const aiResponse = await this.aiCaller.fix(code, error)
    const cleanedCode = stripCodeFences(aiResponse)
    const newCode = PREFIX + writeChangelog(cleanedCode, changelog)

    await this.uploadAndUpdateBlueprint(blueprintId, newCode, changelog)
    logger.info('Script fix operation completed', { blueprintId })
  }

  async classify(blueprintId, prompt) {
    logger.debug('Classifying script', { blueprintId })

    const name = await this.aiCaller.classify(prompt)
    const blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, name }

    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)

    logger.debug('Classification complete', { blueprintId, name })
  }

  async uploadAndUpdateBlueprint(blueprintId, code, changelog) {
    const file = new File([code], 'script.js', { type: 'text/plain' })
    const fileContent = await file.arrayBuffer()
    const hash = await hashFile(Buffer.from(fileContent))
    const filename = `${hash}.js`
    const url = `asset://${filename}`

    await this.world.assets.upload(file)

    const blueprint = this.world.blueprints.get(blueprintId)
    const version = blueprint.version + 1
    const change = { id: blueprint.id, version, script: url }

    this.world.blueprints.modify(change)
    this.world.network.send('blueprintModified', change)
    this.world.network.dirtyBlueprints.add(change.id)

    logger.debug('Blueprint updated', { blueprintId, version, url })
  }
}

const changelogRegex = /\/\*\*[\s\S]*?changelog:[\s\S]*?\*\/\s*/
const entryRegex = /\*\s*-\s*(.+)/g

export function readChangelog(code) {
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

export function writeChangelog(code, changelog) {
  const cleanCode = code.replace(changelogRegex, '')
  const entries = changelog.map(entry => ` * - ${entry}`).join('\n')
  const header = `/**\n * changelog:\n${entries}\n */\n\n`
  return header + cleanCode.trimStart()
}

const fencePattern = /^```(?:\w+)?\s*([\s\S]*?)\s*```$/
export function stripCodeFences(text) {
  let cleaned = text.trim()
  const match = cleaned.match(fencePattern)
  if (match) {
    return match[1]
  }
  return cleaned
}
