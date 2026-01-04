# Phase 6 Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      HYPERFY PARTICLE SYSTEM                     │
│                         (Phase 6 Port)                           │
└─────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │   Main Thread    │
                         │   (Rendering)    │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          ┌─────────▼─────────┐      ┌─────────▼─────────┐
          │  Particle System   │      │  Stage/Scene      │
          │  (Particles.js)    │      │  (PlayCanvas)     │
          └────────┬──────────┘      └──────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
    ┌──────┐  ┌──────┐   ┌─────────┐
    │Emit- │  │Emit- │   │Emitter  │
    │ter 1 │  │ter 2 │   │Factory  │
    │Ctrl  │  │Ctrl  │   │(Config) │
    └──┬───┘  └──┬───┘   └─────────┘
       │         │
       └────┬────┘
            │
     ┌──────▼──────┐
     │MeshInstance │
     │Array        │
     │(PlayCanvas) │
     └──────┬──────┘
            │
            ▼
     ┌─────────────┐
     │GPU Rendering│
     │(Canvas)     │
     └─────────────┘


               Web Worker Boundary ═══════════════════════════════
               ║
               ║   postMessage({op, buffers, ...})
               ║
          ┌────▼────────────────────────────────┐
          │        WORKER (Physics Isolated)    │
          │                                      │
          │  ┌──────────────────────────────┐  │
          │  │  Particle Physics Simulation │  │
          │  │  (No Graphics API)           │  │
          │  └──────────────────────────────┘  │
          │                                      │
          │  • ParticlePool (object recycling)  │
          │  • Physics integration              │
          │  • Buffer calculations              │
          │  • No THREE.js / PlayCanvas refs    │
          │                                      │
          └────────────────────────────────────┘
```

---

## Data Flow Diagram

### Per-Frame Execution

```
┌──────────────────────────────────────────────────────────────┐
│                     FRAME EXECUTION FLOW                      │
└──────────────────────────────────────────────────────────────┘

MAIN THREAD:
┌─────────────────────────────────────────────────────────────┐
│ 1. WorldTickLoop.tick()                                      │
│    └─ Particles.update(delta)                                │
│       └─ for each emitter: controller.update(delta)         │
│          ├─ Calculate camera distance                       │
│          ├─ Pack message: {op:'update', delta, buffers...} │
│          └─ postMessage(msg, [buffer.buffer, ...])         │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ (Zero-copy transfer)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ WORKER THREAD:                                               │
│ 2. onmessage({op:'update', delta, buffers...})             │
│    ├─ SimulationStep(delta)                                 │
│    │  ├─ Update particle age/life                           │
│    │  ├─ Apply velocity & gravity                           │
│    │  ├─ Calculate transforms                               │
│    │  └─ Write to buffers (aPosition, aRotation, ...)      │
│    │                                                        │
│    └─ postMessage({op:'update', n, buffers...}, transfers) │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ (Zero-copy return)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ MAIN THREAD:                                                 │
│ 3. EmitterController.onMessage()                            │
│    ├─ Swap buffers: next = old, buffers = new             │
│    ├─ updateMeshInstances(n)                                │
│    │  └─ for i in [0, n):                                  │
│    │     ├─ Get position from aPosition[i*3]               │
│    │     ├─ meshInstances[i].node.setLocalPosition(pos)    │
│    │     └─ meshInstances[i].visible = true                │
│    │                                                        │
│    └─ Hide unused: for i in [n, max):                      │
│       └─ meshInstances[i].visible = false                  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PlayCanvas Render Pipeline                               │
│    ├─ Collect visible MeshInstances                         │
│    ├─ Batch by material/geometry                            │
│    ├─ GPU render calls                                      │
│    └─ Frame presented                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Message Protocol

### Message Structure

```javascript
// Outbound (Main → Worker)
{
  op: 'create' | 'update' | 'emitting' | 'destroy',
  emitterId: UUID,

  // 'create' message adds:
  duration: number,
  rate: number,
  max: number,
  shape: string,
  // ... emitter config ...

  // 'update' message adds:
  delta: number,
  camPosition: [x, y, z],
  matrixWorld: [...16 floats],
  aPosition: Float32Array,      // Outgoing buffer
  aRotation: Float32Array,
  aDirection: Float32Array,
  aSize: Float32Array,
  aColor: Float32Array,
  aAlpha: Float32Array,
  aEmissive: Float32Array,
  aUV: Float32Array
}

// Inbound (Worker → Main)
{
  op: 'update' | 'end',
  emitterId: UUID,

  // 'update' message adds:
  n: number,                    // Active particle count
  aPosition: Float32Array,      // Incoming buffer (new data)
  aRotation: Float32Array,
  aDirection: Float32Array,
  aSize: Float32Array,
  aColor: Float32Array,
  aAlpha: Float32Array,
  aEmissive: Float32Array,
  aUV: Float32Array

  // 'end' message:
  // (signals emission complete)
}
```

### Transfer List

**Critical for Performance**: Zero-copy buffer transfers

```javascript
// Main → Worker (post)
transfers = [
  aPosition.buffer,
  aRotation.buffer,
  aDirection.buffer,
  aSize.buffer,
  aColor.buffer,
  aAlpha.buffer,
  aEmissive.buffer,
  aUV.buffer
]
worker.postMessage(msg, transfers)
// Result: Buffers are now owned by worker (8 transfers)

// Worker → Main (post)
transfers = [
  aPosition.buffer,    // Same 8 buffers, now with new data
  aRotation.buffer,
  aDirection.buffer,
  aSize.buffer,
  aColor.buffer,
  aAlpha.buffer,
  aEmissive.buffer,
  aUV.buffer
]
worker.postMessage(msg, transfers)
// Result: Buffers are now owned by main thread
```

**Memory Efficiency**: No data copying. Buffers are handed back and forth via ownership transfer.

---

## Class Hierarchy & Interactions

```
┌────────────────────────────────────────┐
│ Particles (System)                      │
│─────────────────────────────────────────│
│ - worker: Worker                        │
│ - emitters: Map<id, Handle>             │
│ - uOrientationFull: pc.Quat             │
│ - uOrientationY: pc.Quat                │
│─────────────────────────────────────────│
│ + init()                                │
│ + register(node): Handle                │
│ + update(delta)                         │
│ + createEmitter(node): Handle           │
│ + onMessage(msg)                        │
│ + destroy()                             │
└──────────┬──────────────────────────────┘
           │ creates
           ▼
┌────────────────────────────────────────┐
│ EmitterController                       │
│─────────────────────────────────────────│
│ - id: UUID                              │
│ - node: ParticleNode                    │
│ - meshInstances: MeshInstance[]         │
│ - worker: Worker                        │
│ - buffers: {aPosition, aRotation, ...}  │
│ - next: {aPosition, aRotation, ...}     │
│ - matrixWorld: Matrix4                  │
│ - pending: bool                         │
│─────────────────────────────────────────│
│ + send(msg, transfers)                  │
│ + setEmitting(value)                    │
│ + onMessage(msg)                        │
│ + update(delta)                         │
│ + updateMeshInstances(count)            │
│ + destroy()                             │
└────────────────────────────────────────┘


┌────────────────────────────────────────┐
│ ParticleMaterialFactory                 │
│─────────────────────────────────────────│
│ billboardModeInts = {                   │
│   full: 0, y: 1, direction: 2          │
│ }                                       │
│─────────────────────────────────────────│
│ + create(config): Material              │
│ + createMaterial(node, uniforms): Mat   │
└────────────────────────────────────────┘


┌────────────────────────────────────────┐
│ ParticleGeometryBuilder                 │
│─────────────────────────────────────────│
│ PARTICLE_ATTRIBUTES = {                 │
│   aPosition: 3, aRotation: 1,           │
│   aDirection: 3, aSize: 1,              │
│   aColor: 3, aAlpha: 1,                 │
│   aEmissive: 1, aUV: 4                  │
│ }                                       │
│─────────────────────────────────────────│
│ + create(maxParticles): {geometry, buf} │
│ + createNextBuffers(maxParticles): buf  │
└────────────────────────────────────────┘
```

---

## Buffer Layout

### Particle Attributes Memory Layout

```
Array Index: 0   1   2   3   4   5   6   7   ...
            [x₀  y₀  z₀  x₁  y₁  z₁  x₂  y₂  ...]  aPosition (3*n)

Array Index: 0   1   2   3   4   5   ...
            [r₀  r₁  r₂  r₃  r₄  r₅  ...]           aRotation (1*n)

Array Index: 0   1   2   3   4   5   ...
            [sx₀ sy₀ sz₀ sx₁ sy₁ sz₁ ...]           aDirection (3*n)

Array Index: 0   1   2   3   4   5   ...
            [s₀  s₁  s₂  s₃  s₄  s₅  ...]           aSize (1*n)

Array Index: 0   1   2   3   4   5   6   7   ...
            [r₀  g₀  b₀  r₁  g₁  b₁  r₂  g₂  ...]  aColor (3*n)

Array Index: 0   1   2   3   4   5   ...
            [a₀  a₁  a₂  a₃  a₄  a₅  ...]           aAlpha (1*n)

Array Index: 0   1   2   3   4   5   ...
            [e₀  e₁  e₂  e₃  e₄  e₅  ...]           aEmissive (1*n)

Array Index: 0   1   2   3   4   5   6   7   ...
            [u₀  v₀  u₁  v₁  u₀  v₀  u₁  v₁  ...]  aUV (4*n)
            └──┬──┘  └──┬──┘  └──┬──┘  └──┬──┘
              p0        p1        p2        p3    (per particle)
```

### Memory Access Pattern

```javascript
// Get particle i's position
const i = particleIndex
const x = aPosition[i*3 + 0]
const y = aPosition[i*3 + 1]
const z = aPosition[i*3 + 2]

// Set particle i's color
aColor[i*3 + 0] = red
aColor[i*3 + 1] = green
aColor[i*3 + 2] = blue

// Sequential access (cache-friendly)
for (let i = 0; i < particleCount; i++) {
  // CPU cache hits: accessing contiguous memory
  const pos = new pc.Vec3(
    aPosition[i*3 + 0],
    aPosition[i*3 + 1],
    aPosition[i*3 + 2]
  )
  meshInstances[i].node.setLocalPosition(pos)
}
```

---

## Rendering Pipeline

### PlayCanvas Render Sequence

```
┌──────────────────────────────────────────┐
│ Entity (particle-emitter)                │
│  └─ RenderComponent                      │
│     └─ meshInstances: [MI₀, MI₁, ..., MIₙ]
└──────────────┬───────────────────────────┘
               │
        ┌──────▼───────┐
        │ Scene Graph  │
        │ Processing   │
        └──────┬───────┘
               │
     ┌─────────▼──────────┐
     │ Collect visible MI │
     │ for rendering      │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │ Material batching  │
     │ (same mat = batch) │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │ Geometry batching  │
     │ (same geo = batch) │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │ GPU Draw calls     │
     └─────────┬──────────┘
               │
     ┌─────────▼──────────┐
     │ Present frame      │
     │ to canvas          │
     └────────────────────┘
```

### Render Order Sorting

```javascript
// Per-frame distance calculation
for (const meshInstance of meshInstances) {
  const distance = cameraPos.distance(particlePos)
  meshInstance.renderOrder = -distance
  // Negative: Reverse sort order (far particles first)
  // Ensures transparency blending works correctly
}
```

**Transparency Requirement**: Particles rendered back-to-front for correct alpha blending.

---

## Integration with World Systems

```
┌─────────────────────────────────────────┐
│ World (Main container)                  │
│─────────────────────────────────────────│
│ + particles: Particles system           │
│ + stage: Stage system                   │
│ + loader: Loader system                 │
│ + camera: Camera entity                 │
│ + rig: Player rig (rotation)            │
│ + xr: XR system                         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┬────────────┐
    │                 │            │
    ▼                 ▼            ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ Particles  │ │ Stage      │ │ Loader     │
│ System     │ │ System     │ │ System     │
│            │ │            │ │            │
│ Emitters   │ │ Scene mgmt │ │ Textures   │
│ Physics    │ │ Octree     │ │ Models     │
│ Worker     │ │ Rendering  │ │ Assets     │
└────────────┘ └────────────┘ └────────────┘

Dependencies (Particles System):
├─ loader.load('texture', url)        → Get textures
├─ stage.scene.addChild(entity)      → Scene integration
├─ camera.getLocalPosition()          → Distance calc
├─ rig.getLocalRotation()             → Billboard orient
└─ xr.camera.getLocalRotation()       → VR override
```

---

## State Transitions

### Emitter Lifecycle

```
┌──────────┐
│ Created  │  new ParticleNode()
└─────┬────┘
      │ register()
      ▼
┌──────────────┐
│ Registered   │  addTo Particles.emitters
└─────┬────────┘
      │ onEmit()
      ▼
┌──────────────┐
│ Emitting     │  setEmitting(true)
│ Active       │  worker.postMessage({op:'update'})
└─────┬────────┘
      │
      ├─ (lifetime expires)
      │
      ▼
┌──────────────┐
│ Emission End │  worker sends {op:'end'}
│ (fadeout)    │  particles still rendering
└─────┬────────┘
      │ (all particles dead)
      │
      ▼
┌──────────────┐
│ Destroyed    │  controller.destroy()
└──────────────┘  scene.removeChild(entity)
```

### Controller Message State Machine

```
Main Thread              Worker
    │                      │
    │ op:'create'          │
    ├─────────────────────>│
    │                      ├─ Init emitter
    │                      ├─ Create pool
    │                      └─ Ready for updates
    │
    │ op:'update'          │
    ├─────────────────────>│ (frame 1)
    │                      ├─ Simulate particles
    │                      └─ Update buffers
    │ op:'update'          │
    │ (waiting...)         <─ Return buffers
    ├─ onMessage()         │
    │  updateMeshInstances │
    │  swapBuffers         │
    │                      │
    │ op:'update'          │
    ├─────────────────────>│ (frame 2)
    │ (waiting...)         │ (same flow)
    │                      │
    │ op:'emitting'        │
    ├─────────────────────>│ (stop emission)
    │                      ├─ Set flag
    │                      └─ Finish existing
    │
    │ (particles die)      │
    │                      │
    │                      ├─ op:'end' signal
    │                      <─────────────────
    │                      │
    │ op:'destroy'         │
    ├─────────────────────>│
    │                      └─ Cleanup
    │
    └─ Emitter destroyed
```

---

## Error Handling

### Error Boundaries

```
┌─────────────────────────────────────────┐
│ Worker Error                            │
│ ├─ out-of-memory                       │
│ ├─ invalid config                      │
│ ├─ simulation crash                    │
│ └─ uncaught exception                  │
│                                         │
│ Handler: Particles.onError             │
│ └─ Log via StructuredLogger             │
│ └─ Graceful shutdown                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Main Thread Error                       │
│ ├─ null camera                          │
│ ├─ missing stage                        │
│ ├─ graphics device unavailable          │
│ └─ MeshInstance creation failed         │
│                                         │
│ Handler: try/catch in specific methods  │
│ └─ Throw early with context             │
│ └─ Logged to console                    │
└─────────────────────────────────────────┘
```

### Observable States

```javascript
// Observable via logging
Particles.emitters.size                    // Active emitter count
EmitterController.particleCount            // Current particle count per emitter
EmitterController.pending                  // Waiting for worker response
UpdateMeshInstances() iterations           // Per-frame position updates
```

---

## Performance Characteristics

### Memory Usage

```
Per Emitter:
├─ Buffers: 8 Float32Arrays
│  └─ (3+1+3+1+3+1+1+4) * 4 * maxParticles
│  └─ = 17 * 4 * maxParticles bytes
│  └─ Example: 1000 particles = 68 KB
│
├─ MeshInstances: maxParticles * sizeof(MeshInstance)
│  └─ ~100-200 bytes per instance
│  └─ Example: 1000 particles = 100-200 KB
│
├─ Worker: Copy of buffers
│  └─ Same size as main thread
│  └─ Example: 1000 particles = 68 KB
│
└─ Total per emitter: ~250 KB per 1000 particles
```

### CPU Time per Frame

```
Main Thread:
├─ Particles.update(delta): O(emitter_count)
├─ EmitterController.update(delta): O(1) message construction
├─ onMessage(): O(1) buffer swap
├─ updateMeshInstances(n): O(n) position updates
│  └─ ~1μs per particle (Vec3 creation + setLocalPosition)
│
└─ Total: O(emitter_count) + O(active_particles)
   Example: 10 emitters × 100 particles = 1ms per frame

Worker Thread:
├─ Simulation: O(particle_count) physics update
├─ Buffer writes: O(particle_count)
└─ Total: Parallel with main thread (no blocking)
```

---

## Conclusion

The Phase 6 architecture maintains clean separation of concerns:

1. **Physics** (Worker): Pure computation, no graphics API
2. **Rendering** (Main): PlayCanvas integration, no physics logic
3. **Communication**: Structured messages with zero-copy buffers
4. **Scalability**: Linear complexity, bounded by particle count

This design enables future evolution to GPU compute or alternative graphics frameworks without refactoring the physics engine.
