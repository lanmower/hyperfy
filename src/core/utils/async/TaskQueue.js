
export class TaskQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency
    this.queue = []
    this.running = 0
    this.stats = { completed: 0, failed: 0, total: 0 }
  }

  async enqueue(fn, priority = 0) {
    const task = { fn, priority, resolve: null, reject: null }
    const promise = new Promise((resolve, reject) => {
      task.resolve = resolve
      task.reject = reject
    })

    this.queue.push(task)
    this.queue.sort((a, b) => b.priority - a.priority)
    this.stats.total++

    this.#process()
    return promise
  }

  async #process() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      this.running++
      const task = this.queue.shift()

      try {
        const result = await task.fn()
        task.resolve(result)
        this.stats.completed++
      } catch (err) {
        task.reject(err)
        this.stats.failed++
      } finally {
        this.running--
        if (this.queue.length > 0) {
          this.#process()
        }
      }
    }
  }

  getStats() {
    return {
      ...this.stats,
      queued: this.queue.length,
      running: this.running,
      concurrency: this.concurrency
    }
  }

  toString() {
    return `TaskQueue(${this.running}/${this.concurrency}, ${this.queue.length} queued)`
  }
}
