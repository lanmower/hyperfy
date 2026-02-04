import { randomBytes } from 'node:crypto'

export class SessionStore {
  constructor(config = {}) {
    this.sessions = new Map()
    this.ttl = config.ttl || 30000
    this._sweepInterval = setInterval(() => this._sweep(), 5000)
  }

  create(playerId, state = {}) {
    const token = randomBytes(16).toString('hex')
    this.sessions.set(token, {
      token,
      playerId,
      state: JSON.parse(JSON.stringify(state)),
      lastSeq: 0,
      pendingInputs: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttl
    })
    return token
  }

  get(token) {
    const session = this.sessions.get(token)
    if (!session) return null
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token)
      return null
    }
    return session
  }

  update(token, updates) {
    const session = this.sessions.get(token)
    if (!session) return false
    if (updates.state) session.state = JSON.parse(JSON.stringify(updates.state))
    if (updates.lastSeq !== undefined) session.lastSeq = updates.lastSeq
    if (updates.pendingInputs) session.pendingInputs = updates.pendingInputs
    session.expiresAt = Date.now() + this.ttl
    return true
  }

  remove(token) {
    return this.sessions.delete(token)
  }

  findByPlayer(playerId) {
    for (const session of this.sessions.values()) {
      if (session.playerId === playerId && Date.now() <= session.expiresAt) {
        return session
      }
    }
    return null
  }

  _sweep() {
    const now = Date.now()
    for (const [token, session] of this.sessions) {
      if (now > session.expiresAt) this.sessions.delete(token)
    }
  }

  getActiveCount() {
    return this.sessions.size
  }

  destroy() {
    clearInterval(this._sweepInterval)
    this.sessions.clear()
  }
}
