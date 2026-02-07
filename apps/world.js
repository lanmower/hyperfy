export default {
  gravity: [0, -9.81, 0],
  entities: [
    { id: 'environment', model: './world/schwust.glb', position: [0, 0, 0], app: 'environment' },
    { id: 'game', position: [0, 0, 0], app: 'tps-game' }
  ],
  playerModel: './world/kaira.glb',
  spawnPoint: [-35, 3, -65]
}
