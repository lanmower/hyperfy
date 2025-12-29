export { LoadShedder } from './LoadShedder.js'
export { RateLimiter } from './RateLimiter.js'
export { QueueManager } from './QueueManager.js'

export function createLoadSheddingSystem(world) {
  return {
    loadShedder: new LoadShedder(world),
    rateLimiter: new RateLimiter(world),
    queueManager: new QueueManager(world)
  }
}
