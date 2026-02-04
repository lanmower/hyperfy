// Inline Promise queue to eliminate p-queue dependency
class PromiseQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency
    this.running = 0
    this.queue = []
  }

  add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) return
    this.running++
    const { fn, resolve, reject } = this.queue.shift()
    try {
      const result = await fn()
      resolve(result)
    } catch (err) {
      reject(err)
    }
    this.running--
    this.process()
  }
}

export class BatchProcessor {
  static processBatch(items, size, fn) {
    const batchSize = Math.min(items.length, size)
    for (let i = 0; i < batchSize; i++) {
      fn(items[i], i)
    }
    return batchSize
  }

  static getBatches(items, size) {
    const batches = []
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size))
    }
    return batches
  }

  static async processBatchesAsync(items, size, asyncFn, concurrency = 1) {
    const queue = new PromiseQueue(concurrency)
    const batches = this.getBatches(items, size)
    const tasks = []
    for (const batch of batches) {
      tasks.push(queue.add(() => Promise.all(batch.map(asyncFn))))
    }
    await Promise.all(tasks)
  }

  static processBatchWithCursor(items, cursor, size, fn) {
    const batchSize = Math.min(items.length, size)
    for (let i = 0; i < batchSize; i++) {
      const idx = (cursor + i) % items.length
      const item = items[idx]
      if (item) fn(item, idx)
    }
    return batchSize ? (cursor + batchSize) % items.length : cursor
  }
}
