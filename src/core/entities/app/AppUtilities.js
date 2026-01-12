import { InputSanitizer } from '../../security/InputSanitizer.js'
import { StructuredLogger } from '../../utils/logging/index.js'

const logger = new StructuredLogger('AppUtilities')

export class AppUtilities {
  constructor(app) {
    this.app = app
    this.timeoutIds = new Set()
  }

  fetch = async (url, options = {}) => {
    try {
      const validation = InputSanitizer.validateURL(url)
      if (!validation.valid) {
        logger.error('Fetch URL validation failed', {
          url,
          appId: this.app.data.id,
          blueprintId: this.app.blueprint?.id,
          violations: validation.violations,
        })
        throw new Error(`URL validation failed: ${validation.violations.map(v => v.message).join(', ')}`)
      }

      const resp = await fetch(url, {
        ...options,
        signal: this.app.abortController.signal,
      })
      const secureResp = {
        ok: resp.ok,
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        json: async () => await resp.json(),
        text: async () => await resp.text(),
        blob: async () => await resp.blob(),
        arrayBuffer: async () => await resp.arrayBuffer(),
      }
      return secureResp
    } catch (err) {
      logger.error('Fetch failed', { url, error: err.message })
    }
  }

  setTimeout = (fn, ms) => {
    const hook = this.getDeadHook()
    const timerId = setTimeout(() => {
      if (hook.dead) return
      fn()
    }, ms)
    this.timeoutIds.add(timerId)
    return timerId
  }

  clearTimeouts() {
    this.timeoutIds.forEach(id => clearTimeout(id))
    this.timeoutIds.clear()
  }

  getDeadHook = () => {
    return this.app.deadHook
  }

  getNodes() {
    if (!this.app.blueprint || !this.app.blueprint.model) return
    const type = this.app.blueprint.model.endsWith('vrm') ? 'avatar' : 'model'
    let glb = this.app.world.loader.get(type, this.app.blueprint.model)
    if (!glb) return
    return glb.toNodes()
  }
}
