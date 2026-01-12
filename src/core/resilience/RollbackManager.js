import { StructuredLogger } from '../utils/logging/index.js'

const logger = new StructuredLogger('RollbackManager')

export class Snapshot {
  constructor(id, data, timestamp = Date.now()) {
    this.id = id
    this.data = JSON.parse(JSON.stringify(data))
    this.timestamp = timestamp
    this.checksum = this.calculateChecksum(data)
  }

  calculateChecksum(data) {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash
  }

  verify(currentData) {
    const currentChecksum = this.calculateChecksum(currentData)
    return currentChecksum === this.checksum
  }
}

export class RollbackManager {
  constructor() {
    this.snapshots = new Map()
    this.activeSnapshot = null
    this.maxSnapshots = 10
  }

  takeSnapshot(id, data) {
    if (this.snapshots.size >= this.maxSnapshots) {
      const oldestId = this.snapshots.keys().next().value
      this.snapshots.delete(oldestId)
    }

    const snapshot = new Snapshot(id, data)
    this.snapshots.set(id, snapshot)
    this.activeSnapshot = id

    logger.info('Snapshot taken', {
      id,
      dataSize: JSON.stringify(data).length,
      timestamp: snapshot.timestamp,
    })

    return snapshot
  }

  rollback(snapshotId) {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) {
      logger.error('Snapshot not found for rollback', { snapshotId })
      throw new Error(`Snapshot ${snapshotId} not found`)
    }

    logger.info('Rolling back to snapshot', {
      snapshotId,
      timestamp: snapshot.timestamp,
      age: Date.now() - snapshot.timestamp,
    })

    return snapshot.data
  }

  list() {
    return Array.from(this.snapshots.values()).map(s => ({
      id: s.id,
      timestamp: s.timestamp,
      age: Date.now() - s.timestamp,
      size: JSON.stringify(s.data).length,
    }))
  }

  clear(snapshotId) {
    if (snapshotId) {
      this.snapshots.delete(snapshotId)
      logger.info('Snapshot cleared', { snapshotId })
    } else {
      const count = this.snapshots.size
      this.snapshots.clear()
      this.activeSnapshot = null
      logger.info('All snapshots cleared', { count })
    }
  }

  verify(snapshotId, currentData) {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) return false
    return snapshot.verify(currentData)
  }

  getActive() {
    return this.activeSnapshot ? this.snapshots.get(this.activeSnapshot) : null
  }
}

export class OperationRollback {
  constructor(name) {
    this.name = name
    this.operations = []
    this.completed = false
    this.startTime = Date.now()
  }

  addOperation(name, fn, rollbackFn) {
    this.operations.push({
      name,
      fn,
      rollbackFn,
      executed: false,
      error: null,
    })
  }

  async execute() {
    logger.info(`Starting operation: ${this.name}`, { operationCount: this.operations.length })

    for (const op of this.operations) {
      try {
        await op.fn()
        op.executed = true
        logger.info(`Operation completed: ${op.name}`, { operation: this.name })
      } catch (error) {
        op.error = error.message
        logger.error(`Operation failed: ${op.name}`, { operation: this.name, error: error.message })
        await this.rollbackAll()
        throw new Error(`Operation ${op.name} failed: ${error.message}`)
      }
    }

    this.completed = true
    logger.info(`Operation completed: ${this.name}`, {
      duration: Date.now() - this.startTime,
      operationCount: this.operations.length,
    })
  }

  async rollbackAll() {
    logger.warn(`Rolling back operation: ${this.name}`, {
      executedCount: this.operations.filter(o => o.executed).length,
    })

    for (let i = this.operations.length - 1; i >= 0; i--) {
      const op = this.operations[i]
      if (!op.executed) continue

      try {
        if (op.rollbackFn) {
          await op.rollbackFn()
          logger.info(`Rollback completed: ${op.name}`, { operation: this.name })
        }
      } catch (error) {
        logger.error(`Rollback failed: ${op.name}`, { operation: this.name, error: error.message })
      }
    }
  }

  getStatus() {
    return {
      name: this.name,
      completed: this.completed,
      duration: Date.now() - this.startTime,
      operations: this.operations.map(op => ({
        name: op.name,
        executed: op.executed,
        error: op.error,
      })),
    }
  }
}

export const rollbackManager = new RollbackManager()
