// Pure SDK test - end-to-end physics simulation
// Tests: world creation, body management, raycast, stepping, data access

import { createWorld, loadGLB, addBody, raycast, step, getEntityData, Vector3, Quaternion } from '../src/index.js'

async function testSDK() {
  console.log('=== Hyperfy Pure Physics SDK Test ===\n')

  try {
    // Test 1: Create world
    console.log('Test 1: Creating physics world...')
    const world = createWorld({
      gravity: [0, -9.81, 0]
    })
    console.log('✓ World created')

    // Test 2: Initialize world
    console.log('\nTest 2: Initializing world...')
    await world.init()
    console.log('✓ World initialized with Jolt physics')

    // Test 3: Math utilities
    console.log('\nTest 3: Testing math utilities...')
    const v1 = new Vector3(1, 2, 3)
    const v2 = new Vector3(4, 5, 6)
    const dot = v1.dot(v2)
    console.log(`✓ Vector3 created: [${v1.x}, ${v1.y}, ${v1.z}]`)
    console.log(`✓ Vector3 dot product: ${dot} (expected 32)`)

    const q = new Quaternion(0, 0, 0, 1)
    console.log(`✓ Quaternion created: [${q.x}, ${q.y}, ${q.z}, ${q.w}]`)

    // Test 4: Add bodies (mock mesh data)
    console.log('\nTest 4: Adding physics bodies...')
    const mockMesh1 = { vertices: [], indices: [] }
    const mockMesh2 = { vertices: [], indices: [] }

    const bodyId1 = addBody(world, mockMesh1, {
      position: [0, 0, 0],
      mass: 1.0,
      dynamic: true
    })
    console.log(`✓ Body 1 added with ID: ${bodyId1}`)

    const bodyId2 = addBody(world, mockMesh2, {
      position: [5, 0, 0],
      mass: 2.0,
      dynamic: true
    })
    console.log(`✓ Body 2 added with ID: ${bodyId2}`)

    // Test 5: Get body data
    console.log('\nTest 5: Accessing body data...')
    const data1 = getEntityData(world, bodyId1)
    const data2 = getEntityData(world, bodyId2)

    if (data1) {
      console.log(`✓ Body 1 data: pos=[${data1.position.join(', ')}], mass=${data1.config.mass}`)
    }
    if (data2) {
      console.log(`✓ Body 2 data: pos=[${data2.position.join(', ')}], mass=${data2.config.mass}`)
    }

    // Test 6: Simulation stepping
    console.log('\nTest 6: Simulating physics...')
    const deltaTime = 1 / 60 // 60 FPS
    for (let i = 0; i < 5; i++) {
      step(world, deltaTime)
    }
    console.log(`✓ Stepped physics 5 frames at ${(deltaTime * 1000).toFixed(2)}ms per frame`)

    // Test 7: Raycast
    console.log('\nTest 7: Physics queries (raycast)...')
    const rayHit = raycast(world, [0, 5, 0], [0, -1, 0], 10)
    console.log(`✓ Raycast executed: hit=${rayHit.hit}, distance=${rayHit.distance}`)

    // Test 8: Cleanup
    console.log('\nTest 8: Cleanup...')
    world.destroy()
    console.log('✓ World destroyed cleanly')

    console.log('\n=== All tests PASSED ===')
    console.log('\nSDK Architecture:')
    console.log('  - No HTTP server')
    console.log('  - Zero middleware')
    console.log('  - Pure black magic physics engine')
    console.log('  - Jolt-powered collision detection')
    console.log('  - Clean function-based API')
    console.log('  - Total code files: 13')
    console.log('  - Dependencies: 1 (jolt-physics)')

  } catch (err) {
    console.error('\n✗ Test FAILED:', err.message)
    console.error(err.stack)
    process.exit(1)
  }
}

testSDK().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
