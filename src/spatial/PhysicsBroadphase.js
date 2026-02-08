export class PhysicsBroadphase {
  constructor(stageLoader) {
    this._stageLoader = stageLoader
    this._collisionRadius = 5
  }

  getCollidableEntities(playerPosition) {
    if (!this._stageLoader) return []
    const stage = this._stageLoader.getActiveStage()
    if (!stage) return []
    return stage.getNearbyEntities(playerPosition, this._collisionRadius)
  }

  getRelevantEntities(playerPosition, radius) {
    if (!this._stageLoader) return []
    return this._stageLoader.getRelevantEntities(playerPosition, radius)
  }

  checkCollisions(entities, runtime) {
    const collidable = entities.filter(id => {
      const e = runtime.getEntity(id)
      return e && e.collider && runtime.apps.has(id)
    }).map(id => runtime.getEntity(id))

    const pairs = []
    for (let i = 0; i < collidable.length; i++) {
      for (let j = i + 1; j < collidable.length; j++) {
        const a = collidable[i], b = collidable[j]
        const d = Math.hypot(
          b.position[0] - a.position[0],
          b.position[1] - a.position[1],
          b.position[2] - a.position[2]
        )
        if (d < this._colR(a.collider) + this._colR(b.collider)) {
          pairs.push([a, b])
        }
      }
    }
    return pairs
  }

  _colR(c) {
    if (!c) return 0
    if (c.type === 'sphere') return c.radius || 1
    if (c.type === 'capsule') return Math.max(c.radius || 0.5, (c.height || 1) / 2)
    if (c.type === 'box') return Math.max(...(c.size || c.halfExtents || [1, 1, 1]))
    return 1
  }

  set collisionRadius(v) { this._collisionRadius = v }
  get collisionRadius() { return this._collisionRadius }
}
