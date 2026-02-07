export default {
  port: 8080,
  tickRate: 128,
  gravity: [0, -9.81, 0],
  movement: {
    maxSpeed: 8.0,
    groundAccel: 10.0,
    airAccel: 1.0,
    friction: 7.2,
    stopSpeed: 2.0,
    jumpImpulse: 4.5
  },
  entities: [
    { id: 'environment', model: './apps/tps-game/schwust.glb', position: [0, 0, 0] },
    { id: 'game', position: [0, 0, 0], app: 'tps-game' }
  ],
  playerModel: './world/kaira.glb',
  spawnPoint: [-35, 3, -65]
}
