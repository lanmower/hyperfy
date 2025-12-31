import PQueue from 'p-queue'

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
    const queue = new PQueue({ concurrency })
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
