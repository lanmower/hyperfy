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
    { id: 'environment', model: './world/schwust.glb', position: [0, 0, 0] },
    { id: 'game', position: [0, 0, 0], app: 'tps-game' },
    { id: 'door-1', model: './world/schwust.glb', position: [10, 0, 5], app: 'example-door', scale: [0.5, 1, 0.5] },
    { id: 'door-2', model: './world/schwust.glb', position: [20, 0, 10], app: 'example-door', scale: [0.5, 1, 0.5] }
  ],
  playerModel: './world/kaira.glb',
  spawnPoint: [-35, 3, -65]
}
