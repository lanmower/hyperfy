export class SnapshotEncoder {
  static encode(snapshot) {
    const players = []
    for (const player of snapshot.players) {
      const compressed = {
        i: player.id,
        p: this.encodeVector(player.position),
        r: this.encodeQuat(player.rotation),
        v: this.encodeVector(player.velocity),
        g: player.onGround ? 1 : 0,
        h: Math.round(player.health),
        s: player.inputSequence
      }
      players.push(compressed)
    }
    return {
      tick: snapshot.tick,
      ts: snapshot.timestamp,
      p: players
    }
  }

  static decode(data) {
    const players = []
    for (const compressed of data.p) {
      const player = {
        id: compressed.i,
        position: this.decodeVector(compressed.p),
        rotation: this.decodeQuat(compressed.r),
        velocity: this.decodeVector(compressed.v),
        onGround: compressed.g === 1,
        health: compressed.h,
        inputSequence: compressed.s
      }
      players.push(player)
    }
    return {
      tick: data.tick,
      timestamp: data.ts,
      players
    }
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
    const encoded = this.encode(snapshot)
    return JSON.stringify(encoded).length
  }
}
