import fs from 'fs-extra'
import { cloneDeep, throttle } from 'lodash-es'
import { LoggerFactory } from '../core/utils/logging/index.js'

const logger = LoggerFactory.get('Storage')

export class Storage {
  constructor(file, circuitBreakerManager = null) {
    this.file = file
    this.circuitBreakerManager = circuitBreakerManager
    try {
      this.data = fs.readJsonSync(this.file)
    } catch (err) {
      this.data = {}
    }
    this.save = throttle(() => this.persist(), 1000, { leading: true, trailing: true })
  }

  get(key) {
    return this.data[key]
  }

  set(key, value) {
    try {
      value = JSON.parse(JSON.stringify(value))
      this.data[key] = value
      this.save()
    } catch (err) {
      logger.error('Failed to set storage value', { key, error: err.message })
    }
  }

  async persist() {
    const executePersist = async () => {
      try {
        await fs.writeJson(this.file, this.data)
      } catch (err) {
        logger.error('Failed to persist storage', { file: this.file, error: err.message })
        throw err
      }
    }

    if (this.circuitBreakerManager && this.circuitBreakerManager.has('storage')) {
      try {
        await this.circuitBreakerManager.execute('storage', executePersist)
      } catch (err) {
        if (err.code === 'CIRCUIT_OPEN') {
          logger.error('Storage circuit open, persist skipped', { status: 'CIRCUIT_OPEN' })
        }
      }
    } else {
      try {
        await executePersist()
      } catch (err) {
      }
    }
  }
}
