export default {
  gravity: [0, -9.81, 0],
  entities: [
    { id: 'floor', model: 'floor.glb', position: [0, 0, 0], app: 'static-mesh' },
    { id: 'crate1', model: 'crate.glb', position: [5, 2, 0], app: 'physics-crate' },
    { id: 'crate2', model: 'crate.glb', position: [7, 4, 0], app: 'physics-crate' },
    { id: 'door1', model: 'door.glb', position: [10, 0, 0], app: 'interactive-door' },
    { id: 'npc1', model: 'robot.glb', position: [3, 0, 3], app: 'patrol-npc' }
  ]
}
