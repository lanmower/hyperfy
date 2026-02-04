# CLAUDE.md - Hyperfy SDK Technical Reference

## ARCHITECTURE

### Physics + Netcode SDK (Display-Engine Agnostic)
- SDK handles ONLY physics setup and netcode
- No rendering, no display code anywhere in the codebase
- Works with THREE.js, Babylon, PlayCanvas, or any display engine
- Client receives position/rotation/velocity data and renders however it wants

### Dependencies (3 packages)
- `jolt-physics` - Jolt Physics WASM for real rigid body simulation
- `msgpackr` - Binary encoding for network snapshots (70% smaller than JSON)
- `ws` - WebSocket server for Node.js

---

## SERVER

### Tick System
- 128 TPS fixed timestep via `setImmediate` loop
- `TickSystem` fires callbacks at 7.8125ms intervals
- Verified: ~124 ticks per second in production

### Physics Engine
- Jolt Physics WASM (`jolt-physics/wasm-compat`)
- Two collision layers: STATIC (0) and DYNAMIC (1)
- Body types: Static boxes, trimesh colliders from GLB, dynamic capsules/boxes, kinematic capsules
- GLB mesh extraction: reads binary glTF, extracts vertex/index data, builds Jolt TriangleList
- Trimesh creation for schwust.glb (9,932 triangles): ~59ms

### Network Protocol
- Binary msgpackr over WebSocket
- Message types: 1=player_assigned, 2=world_state, 3=input, 4=interact, 5=disconnect, 6=snapshot
- Snapshot format: `[tick, timestamp, [[player_arrays]], [[entity_arrays]]]`
- Player array: `[id, px, py, pz, rx, ry, rz, rw, vx, vy, vz, onGround, health, inputSeq]`

### Netcode Components
- `PlayerManager` - Socket management, input buffering, binary broadcast
- `NetworkState` - Authoritative player state tracking
- `LagCompensator` - Server-side state history, time rewind, teleport/speed detection
- `HitValidator` - Shot validation with lag compensation
- `PhysicsIntegration` - Server-side player physics (gravity, ground collision)
- `BandwidthOptimizer` - Delta compression between snapshots
- `CullingManager` - Distance-based relevance filtering
- `SnapshotEncoder` - msgpackr binary encode/decode with quantization

### Client Components
- `PredictionEngine` - Client-side input prediction with server reconciliation
- `ReconciliationEngine` - Correction blending when server state diverges
- `InputHandler` - Keyboard/mouse input capture (browser)
- `RenderSync` - Display state management (engine-agnostic data output)
- `PhysicsNetworkClient` - Full client with prediction, snapshot processing

---

## APP SYSTEM

### Single-File Client/Server Format
```javascript
export default {
  server: {
    setup(ctx) { },
    update(ctx, dt) { },
    teardown(ctx) { },
    onCollision(ctx, other) { },
    onInteract(ctx, player) { }
  },
  client: {
    render(ctx) {
      return { model, position, rotation, custom }
    }
  }
}
```

### App Context (ctx)
- `ctx.entity` - id, model, position, rotation, scale, velocity, custom, destroy()
- `ctx.physics` - setStatic, setDynamic, setKinematic, setMass, addBoxCollider, addSphereCollider, addCapsuleCollider, addMeshCollider, addTrimeshCollider, addForce, setVelocity
- `ctx.world` - spawn, destroy, query, getEntity, gravity
- `ctx.players` - getAll, getNearest, send, broadcast
- `ctx.time` - tick, deltaTime, elapsed
- `ctx.state` - Persistent app state (survives hot reload)
- `ctx.events` - emit, on, off, once
- `ctx.network` - broadcast, sendTo

### Hot Reload
- `AppLoader` watches apps directory via `fs.watch`
- On file change: validates source, re-imports module, calls teardown on old, setup on new
- App state (`ctx.state`) preserved across reloads

---

## GLB ASSETS

### world/schwust.glb (4.1 MB)
- Environment mesh (Dust2-style map)
- Node "Collider" (mesh 0): 17,936 vertices, 9,932 triangles
- Bounds: X[-64, 48] Y[-5, 10] Z[-94, 38]
- Used as static trimesh collider

### world/kaira.glb (13 KB)
- Character model reference
- 320 vertices, 308 triangles
- Referenced in world definition as playerModel

---

## WORLD DEFINITION

```javascript
// apps/world.js
export default {
  gravity: [0, -9.81, 0],
  entities: [
    { id: 'environment', model: './world/schwust.glb', position: [0,0,0], app: 'environment' }
  ],
  playerModel: './world/kaira.glb',
  spawnPoint: [0, 2, 0]
}
```

---

## FILE STRUCTURE (30 files, all under 200 lines)

```
src/
  index.js                    - Barrel exports
  physics/
    World.js                  - Jolt WASM physics world
    GLBLoader.js              - GLB mesh extraction
  sdk/
    server.js                 - Server SDK (physics + WS + tick + apps)
    client.js                 - Client SDK (binary protocol + state)
  netcode/
    TickSystem.js             - 128 TPS fixed timestep
    InputBuffer.js            - Sequenced input buffer
    NetworkState.js           - Player state tracking
    SnapshotEncoder.js        - msgpackr binary encoding
    PlayerManager.js          - Socket + input management
    BandwidthOptimizer.js     - Delta compression
    CullingManager.js         - Distance relevance
    LagCompensator.js         - State history + rewind
    HitValidator.js           - Shot validation
    PhysicsIntegration.js     - Server player physics
  client/
    InputHandler.js           - Browser input capture
    PhysicsNetworkClient.js   - Client with prediction
    PredictionEngine.js       - Client prediction
    ReconciliationEngine.js   - Server reconciliation
    RenderSync.js             - Display state output
  apps/
    AppContext.js             - App API proxy
    AppLoader.js              - File loading + hot reload
    AppRuntime.js             - App lifecycle + entity management
    EntityAppBinder.js        - Entity-app binding + world loading
apps/
  world.js                    - World definition
  environment.js              - Static trimesh collider
  static-mesh.js              - Generic static mesh
  interactive-door.js         - Proximity door
  patrol-npc.js               - Waypoint patrol
  physics-crate.js            - Dynamic box
world/
  schwust.glb                 - Environment mesh
  kaira.glb                   - Player model
```
