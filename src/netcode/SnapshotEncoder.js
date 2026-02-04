export class SnapshotEncoder {
  static encode(snapshot) {
    const players = []
    for (const player of (snapshot.players || [])) {
      players.push({
        i: player.id,
        p: this.encodeVector(player.position),
        r: this.encodeQuat(player.rotation),
        v: this.encodeVector(player.velocity),
        g: player.onGround ? 1 : 0,
        h: Math.round(player.health),
        s: player.inputSequence
      })
    }
    const entities = []
    for (const ent of (snapshot.entities || [])) {
      const encoded = {
        i: ent.id,
        m: ent.model,
        p: this.encodeVec3(ent.position),
        r: this.encodeRotation(ent.rotation),
        sc: this.encodeVec3(ent.scale),
        bt: ent.bodyType
      }
      if (ent.animation) encoded.an = ent.animation
      if (ent.effects) encoded.ef = ent.effects
      if (ent.sound) encoded.sn = ent.sound
      if (ent.custom) encoded.cu = ent.custom
      entities.push(encoded)
    }
    const result = { tick: snapshot.tick, ts: snapshot.timestamp }
    if (players.length) result.p = players
    if (entities.length) result.e = entities
    return result
  }

  static decode(data) {
    const players = []
    for (const c of (data.p || [])) {
      players.push({
        id: c.i,
        position: this.decodeVector(c.p),
        rotation: this.decodeQuat(c.r),
        velocity: this.decodeVector(c.v),
        onGround: c.g === 1,
        health: c.h,
        inputSequence: c.s
      })
    }
    const entities = []
    for (const c of (data.e || [])) {
      entities.push({
        id: c.i,
        model: c.m,
        position: this.decodeVec3(c.p),
        rotation: this.decodeRotation(c.r),
        scale: this.decodeVec3(c.sc),
        bodyType: c.bt,
        animation: c.an || null,
        effects: c.ef || null,
        sound: c.sn || null,
        custom: c.cu || null
      })
    }
    return { tick: data.tick, timestamp: data.ts, players, entities }
  }

  static encodeVector(v) {
    return {
      x: Math.round(v[0] * 100) / 100,
      y: Math.round(v[1] * 100) / 100,
      z: Math.round(v[2] * 100) / 100
    }
  }

  static decodeVector(v) {
    return [v.x, v.y, v.z]
  }

  static encodeVec3(v) {
    if (!v) return [0, 0, 0]
    const arr = Array.isArray(v) ? v : [v.x || 0, v.y || 0, v.z || 0]
    return arr.map(n => Math.round(n * 100) / 100)
  }

  static decodeVec3(v) {
    return Array.isArray(v) ? [...v] : [0, 0, 0]
  }

  static encodeRotation(r) {
    if (!r) return [0, 0, 0, 1]
    if (Array.isArray(r)) return r.map(n => Math.round(n * 10000) / 10000)
    return { x: r.x || 0, y: r.y || 0, z: r.z || 0, w: r.w !== undefined ? r.w : 1 }
  }

  static decodeRotation(r) {
    if (Array.isArray(r)) return [...r]
    return r
  }

  static encodeQuat(q) {
    return {
      x: Math.round(q[0] * 10000) / 10000,
      y: Math.round(q[1] * 10000) / 10000,
      z: Math.round(q[2] * 10000) / 10000,
      w: Math.round(q[3] * 10000) / 10000
    }
  }

  static decodeQuat(q) {
    return [q.x, q.y, q.z, q.w]
  }

  static getSize(snapshot) {
    return JSON.stringify(this.encode(snapshot)).length
  }
}
