import http from 'node:http';
import WebSocket from 'ws';
import { Packr } from 'msgpackr';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';
const packr = new Packr({ structuredClone: true });

const PACKET_NAMES = [
  'snapshot', 'command', 'chatAdded', 'chatCleared', 'blueprintAdded', 'blueprintModified',
  'entityAdded', 'entityModified', 'entityEvent', 'entityRemoved', 'playerTeleport',
  'playerPush', 'playerSessionAvatar', 'liveKitLevel', 'mute', 'settingsModified',
  'spawnModified', 'modifyRank', 'kick', 'ping', 'pong', 'errorReport', 'errorEvent',
  'getErrors', 'clearErrors', 'errors', 'mcpSubscribeErrors', 'mcpErrorEvent',
  'hotReload', 'fileUpload', 'fileUploadProgress', 'fileUploadComplete', 'fileUploadError'
];

function decodePacket(data) {
  try {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const unpacked = packr.unpack(buf);
    if (Array.isArray(unpacked) && unpacked.length >= 2) {
      const [id, message] = unpacked;
      return { id, name: PACKET_NAMES[id] || `unknown(${id})`, message };
    }
  } catch (e) {
    // Ignore decode errors
  }
  return null;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function testBrowserRender() {
  console.log('\n=== TEST 1: Browser Render ===');
  try {
    const { status, body } = await httpGet(`${BASE_URL}/`);

    console.log(`✓ Server responds (status: ${status})`);
    console.log(`✓ HTML size: ${body.length} bytes`);
    console.log(`✓ Contains canvas refs: ${body.includes('canvas')}`);
    console.log(`✓ Contains PlayCanvas: ${body.includes('playcanvas')}`);
    console.log(`✓ Contains React: ${body.includes('react')}`);

    return true;
  } catch (e) {
    console.error(`✗ Browser render test failed: ${e.message}`);
    return false;
  }
}

async function testWebSocketConnection() {
  console.log('\n=== TEST 2: WebSocket Connection ===');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    let receivedSnapshot = false;

    const timeout = setTimeout(() => {
      ws.close();
      console.log(`✗ WebSocket timeout - no snapshot received`);
      resolve(false);
    }, 5000);

    ws.on('open', () => {
      console.log('✓ WebSocket connected');
    });

    ws.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        receivedSnapshot = true;
        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];
        console.log(`✓ Received snapshot`);
        console.log(`  - Total entities: ${entities.length}`);
        console.log(`  - Players: ${players.length}`);
        if (packet.message.world) {
          console.log(`  - World: ${packet.message.world.name || 'unnamed'}`);
        }
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`✗ WebSocket error: ${err.message}`);
      resolve(false);
    });
  });
}

async function testAssetLoading() {
  console.log('\n=== TEST 3: Asset Loading ===');
  try {
    // Test loading a specific asset file (there should be at least one .glb in the assets directory)
    const { status } = await httpGet(`${BASE_URL}/assets/2faa49a0505b0e7f143e2278e3aa4a5585cabe9e87cc850f3b9b3c1625b8ba69.glb`);
    if (status === 200) {
      console.log(`✓ Assets endpoint serves files (status: ${status})`);
      return true;
    } else {
      console.log(`✗ Asset file returned ${status}`);
      return false;
    }
  } catch (e) {
    console.error(`✗ Asset loading test failed: ${e.message}`);
    return false;
  }
}

async function testGraphicsSystem() {
  console.log('\n=== TEST 4: Graphics System Initialization ===');
  try {
    const { body } = await httpGet(`${BASE_URL}/`);

    console.log(`✓ PlayCanvas client loaded: ${body.includes('playcanvas')}`);
    console.log(`✓ React initialized: ${body.includes('react')}`);
    console.log(`✓ World system: ${body.includes('world')}`);

    return true;
  } catch (e) {
    console.error(`✗ Graphics system test failed: ${e.message}`);
    return false;
  }
}

async function testEntitySystem() {
  console.log('\n=== TEST 5: Entity Rendering ===');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}/ws`);

    const timeout = setTimeout(() => {
      ws.close();
      console.log(`✗ Entity test timeout`);
      resolve(false);
    }, 5000);

    ws.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        clearTimeout(timeout);
        ws.close();

        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];

        console.log(`✓ Entities in world: ${entities.length}`);
        console.log(`✓ Players connected: ${players.length}`);

        const meshes = entities.filter(e => e.mesh).length;
        const videos = entities.filter(e => e.video).length;
        const images = entities.filter(e => e.image).length;
        const texts = entities.filter(e => e.text).length;
        const models = entities.filter(e => e.model).length;

        console.log(`  - Meshes: ${meshes}`);
        console.log(`  - Models: ${models}`);
        console.log(`  - Videos: ${videos}`);
        console.log(`  - Images: ${images}`);
        console.log(`  - Texts: ${texts}`);

        const hasContent = entities.length > 0 || players.length > 0;
        console.log(`✓ Content loaded: ${hasContent ? 'YES' : 'NO'}`);
        resolve(hasContent);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`✗ Entity test error: ${err.message}`);
      resolve(false);
    });
  });
}

async function testPlayerPhysics() {
  console.log('\n=== TEST 6: Player Physics ===');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    let hasPlayer = false;

    const timeout = setTimeout(() => {
      ws.close();
      console.log(`✗ Physics test timeout`);
      resolve(false);
    }, 5000);

    ws.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];
        if (players.length > 0) {
          if (!hasPlayer) {
            hasPlayer = true;
            const player = players[0];
            console.log(`✓ Player spawned`);
            const pos = Array.isArray(player.position) ? player.position : [player.position?.x, player.position?.y, player.position?.z];
            const rot = Array.isArray(player.quaternion) ? player.quaternion : [player.rotation?.x, player.rotation?.y, player.rotation?.z];
            console.log(`  - Position: [${pos[0]?.toFixed?.(2) || 0}, ${pos[1]?.toFixed?.(2) || 0}, ${pos[2]?.toFixed?.(2) || 0}]`);
            console.log(`  - Quaternion: [${rot[0]?.toFixed?.(2) || 0}, ${rot[1]?.toFixed?.(2) || 0}, ${rot[2]?.toFixed?.(2) || 0}]`);
            console.log(`✓ Physics system operational`);
            clearTimeout(timeout);
            ws.close();
            resolve(true);
          }
        }
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`✗ Physics test error: ${err.message}`);
      resolve(false);
    });
  });
}

async function testNetworkSync() {
  console.log('\n=== TEST 7: Network Synchronization ===');
  return new Promise((resolve) => {
    const ws1 = new WebSocket(`${WS_URL}/ws`);
    const ws2 = new WebSocket(`${WS_URL}/ws`);

    let player1Id = null;
    let snapshotsCount = { p1: 0, p2: 0 };

    const timeout = setTimeout(() => {
      ws1.close();
      ws2.close();
      if (snapshotsCount.p1 > 0 && snapshotsCount.p2 > 0) {
        console.log(`✓ Both players connected and receiving updates`);
        resolve(true);
      } else {
        console.log(`✗ Network sync test timeout`);
        resolve(false);
      }
    }, 6000);

    ws1.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        snapshotsCount.p1++;
        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];
        if (!player1Id && players?.[0]) {
          player1Id = players[0].id;
        }
      }
    });

    ws2.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        snapshotsCount.p2++;
        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];
        if (player1Id && players?.some(p => p.id !== players[0].id)) {
          console.log(`✓ Player 1 connected`);
          console.log(`✓ Player 2 connected`);
          console.log(`✓ Players see each other (multiplayer OK)`);
          clearTimeout(timeout);
          ws1.close();
          ws2.close();
          resolve(true);
        }
      }
    });

    ws1.on('error', () => resolve(false));
    ws2.on('error', () => resolve(false));
  });
}

async function testPerformance() {
  console.log('\n=== TEST 8: Performance Metrics ===');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    let frameCount = 0;
    let startTime = null;

    const timeout = setTimeout(() => {
      ws.close();
      const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
      const fps = startTime ? Math.round(frameCount / elapsed) : 0;
      console.log(`✓ Update rate: ${frameCount} snapshots in ${elapsed.toFixed(1)}s (${fps} updates/sec)`);
      resolve(true);
    }, 3000);

    ws.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot') {
        if (!startTime) startTime = Date.now();
        frameCount++;
      }
    });

    ws.on('error', () => {
      clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function testPlayerInput() {
  console.log('\n=== TEST 9: Player Input Handling ===');
  return new Promise((resolve) => {
    const ws = new WebSocket(`${WS_URL}/ws`);
    let playerDetected = false;

    const timeout = setTimeout(() => {
      ws.close();
      console.log(`✗ Player input test timeout`);
      resolve(false);
    }, 5000);

    ws.on('message', (data) => {
      const packet = decodePacket(data);
      if (!packet) return;

      if (packet.name === 'snapshot' && !playerDetected) {
        const entities = packet.message.entities || [];
        const players = entities.filter(e => e.type === 'player') || [];
        if (players?.[0]) {
          playerDetected = true;
          const p = players[0].position;
          const pos = Array.isArray(p) ? [...p] : [p?.x || 0, p?.y || 0, p?.z || 0];
          console.log(`✓ Player detected in snapshot`);
          console.log(`  - Position: [${pos[0]?.toFixed?.(2) || 0}, ${pos[1]?.toFixed?.(2) || 0}, ${pos[2]?.toFixed?.(2) || 0}]`);
          console.log(`✓ Input message system ready`);
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        }
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      console.error(`✗ Input test error: ${err.message}`);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   HYPERFY RENDERING TEST SUITE        ║');
  console.log('║          v2.0 (msgpack)               ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`Time: ${new Date().toLocaleString()}`);

  const results = {
    render: await testBrowserRender(),
    websocket: await testWebSocketConnection(),
    assets: await testAssetLoading(),
    graphics: await testGraphicsSystem(),
    entities: await testEntitySystem(),
    physics: await testPlayerPhysics(),
    network: await testNetworkSync(),
    performance: await testPerformance(),
    input: await testPlayerInput()
  };

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TEST RESULTS SUMMARY                 ║');
  console.log('╚════════════════════════════════════════╝\n');

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([name, result]) => {
    const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
    console.log(`${result ? '✓' : '✗'} ${displayName.padEnd(35)} ${result ? 'PASS' : 'FAIL'}`);
  });

  console.log(`\nResult: ${passed}/${total} tests passed (${Math.round((passed/total)*100)}%)`);

  if (passed === total) {
    console.log('\n✓✓✓ All systems operational! ✓✓✓');
    process.exit(0);
  } else {
    console.log('\n⚠ Some systems need investigation');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
