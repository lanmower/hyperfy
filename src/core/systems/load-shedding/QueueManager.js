import { ComponentLogger } from '../../utils/logging/ComponentLogger.js'

const logger = new ComponentLogger('QueueManager')

export class QueueManager {
  constructor(world) {
    this.world = world
    this.queues = new Map()
  }

  createQueue(name, options = {}) {
    const queue = {
      name,
      items: [],
      maxSize: options.maxSize || 1000,
      priorityLevels: options.priorityLevels || 5,
      drainRate: options.drainRate || 100,
      lastDrainTime: Date.now(),
      stats: {
        added: 0,
        removed: 0,
        dropped: 0,
        currentSize: 0
      }
    }

    this.queues.set(name, queue)
    logger.info('Queue created', { name, maxSize: queue.maxSize })
    return queue
  }

  enqueue(queueName, item, priority = 3) {
    const queue = this.queues.get(queueName)
    if (!queue) {
      logger.warn('Queue not found', { queue: queueName })
      return false
    }

    if (queue.items.length >= queue.maxSize) {
      queue.stats.dropped++
      return false
    }

    const prioritized = {
      item,
      priority: Math.min(priority, queue.priorityLevels - 1),
      enqueuedAt: Date.now()
    }

    queue.items.push(prioritized)
    queue.stats.added++
    queue.stats.currentSize = queue.items.length

    queue.items.sort((a, b) => b.priority - a.priority)

    return true
  }

  dequeue(queueName, count = 1) {
    const queue = this.queues.get(queueName)
    if (!queue) return []

    const items = []
    for (let i = 0; i < count && queue.items.length > 0; i++) {
      const prioritized = queue.items.shift()
      items.push(prioritized.item)
      queue.stats.removed++
    }

    queue.stats.currentSize = queue.items.length
    return items
  }

  drain(queueName) {
    const queue = this.queues.get(queueName)
    if (!queue) return []

    const now = Date.now()
    const timeSinceLastDrain = now - queue.lastDrainTime
    const itemsToDrain = Math.floor((timeSinceLastDrain / 1000) * queue.drainRate)

    if (itemsToDrain === 0) {
      return []
    }

    queue.lastDrainTime = now
    return this.dequeue(queueName, itemsToDrain)
  }

  drainAll() {
    const drained = {}
    for (const name of this.queues.keys()) {
      drained[name] = this.drain(name)
    }
    return drained
  }

  peek(queueName, count = 1) {
    const queue = this.queues.get(queueName)
    if (!queue) return []

    return queue.items.slice(0, count).map(p => p.item)
  }

  getQueueStats(queueName) {
    const queue = this.queues.get(queueName)
    if (!queue) return null

    return {
      name: queueName,
      currentSize: queue.items.length,
      maxSize: queue.maxSize,
      utilizationRate: queue.items.length / queue.maxSize,
      added: queue.stats.added,
      removed: queue.stats.removed,
      dropped: queue.stats.dropped,
      dropRate: queue.stats.added > 0 ? queue.stats.dropped / queue.stats.added : 0,
      averageWaitTime: this.calculateAverageWaitTime(queue)
    }
  }

  calculateAverageWaitTime(queue) {
    if (queue.items.length === 0) return 0

    const now = Date.now()
    const totalWait = queue.items.reduce((sum, p) => sum + (now - p.enqueuedAt), 0)
    return totalWait / queue.items.length
  }

  getAllQueueStats() {
    const stats = {}
    for (const name of this.queues.keys()) {
      stats[name] = this.getQueueStats(name)
    }
    return stats
  }

  getQueueSize(queueName) {
    const queue = this.queues.get(queueName)
    return queue ? queue.items.length : 0
  }

  isEmpty(queueName) {
    const queue = this.queues.get(queueName)
    return !queue || queue.items.length === 0
  }

  clear(queueName) {
    const queue = this.queues.get(queueName)
    if (queue) {
      const size = queue.items.length
      queue.items = []
      queue.stats.currentSize = 0
      logger.info('Queue cleared', { queue: queueName, itemsCleared: size })
    }
  }

  clearAll() {
    for (const name of this.queues.keys()) {
      this.clear(name)
    }
  }

  adjustDrainRate(queueName, newRate) {
    const queue = this.queues.get(queueName)
    if (queue) {
      queue.drainRate = newRate
    }
  }
}
