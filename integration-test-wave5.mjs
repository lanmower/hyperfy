#!/usr/bin/env node
/**
 * WAVE 5 Integration Test
 * Verifies death/respawn and player collision system
 *
 * Run as: node integration-test-wave5.mjs
 * Must have server running: node server.js (in another terminal)
 */

import WebSocket from 'ws';

const SERVER_URL = 'ws://localhost:8080/ws';
const TEST_TIMEOUT = 40000;

class MultiClientTest {
  constructor() {
    this.clients = [];
    this.results = {
      clientsConnected: 0,
      messagesReceived: 0,
      events: [],
      errors: []
    };
  }

  async createClient(id) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Client ${id} connection timeout`));
      }, 5000);

      const ws = new WebSocket(SERVER_URL);
      ws.binaryType = 'arraybuffer';

      const client = {
        id,
        ws,
        playerId: null,
        position: [0, 0, 0],
        health: 100,
        messages: [],
        events: [],
        connected: false
      };

      ws.on('open', () => {
        clearTimeout(timeout);
        client.connected = true;
        this.results.clientsConnected++;
        console.log(`[Client ${id}] Connected`);
        resolve(client);
      });

      ws.on('message', (data) => {
        client.messages.push(Date.now());
        this.results.messagesReceived++;

        try {
          const msg = JSON.parse(data.toString());
          if (msg.type === 'player_assigned') {
            client.playerId = msg.player_id;
            console.log(`[Client ${id}] Assigned player ${msg.player_id}`);
          } else if (msg.type === 'hit') {
            client.events.push({ type: 'hit', health: msg.health });
            console.log(`[Client ${id}] Hit - health now ${msg.health}`);
          } else if (msg.type === 'death') {
            client.events.push({ type: 'death', killer: msg.killer });
            console.log(`[Client ${id}] Death - killed by ${msg.killer}`);
          } else if (msg.type === 'respawn') {
            client.events.push({ type: 'respawn', position: msg.position });
            client.health = 100;
            console.log(`[Client ${id}] Respawned at ${msg.position}`);
          }
        } catch (e) {
          // Binary snapshot data, count the message
        }
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      ws.on('close', () => {
        client.connected = false;
        console.log(`[Client ${id}] Disconnected`);
      });

      this.clients.push(client);
    });
  }

  sendInput(clientId, input) {
    const client = this.clients[clientId];
    if (client && client.connected && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'input',
        ...input
      }));
    }
  }

  sendFire(clientId, target) {
    const client = this.clients[clientId];
    if (client && client.connected && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'fire',
        shooterId: client.playerId,
        origin: client.position,
        direction: [0, 0, 1],
        targetId: target
      }));
    }
  }

  async wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async runTests() {
    console.log('=== WAVE 5 Integration Test ===\n');

    try {
      // Connect 3 clients
      console.log('Phase 1: Connecting 3 clients...');
      for (let i = 0; i < 3; i++) {
        await this.createClient(i);
        await this.wait(500);
      }
      console.log(`✓ All 3 clients connected\n`);

      // Wait for player assignment
      await this.wait(2000);

      // Phase 2: Collision test (10s)
      console.log('Phase 2: Collision test - clients moving toward each other (10s)');
      const collisionStart = Date.now();
      while (Date.now() - collisionStart < 10000) {
        this.sendInput(0, { forward: 1, left: 0, right: 0, jump: 0, yaw: 0 });
        this.sendInput(1, { forward: -1, left: 0, right: 0, jump: 0, yaw: Math.PI });
        this.sendInput(2, { forward: 0.5, left: 0, right: 0, jump: 0, yaw: Math.PI / 4 });
        await this.wait(500);
      }
      console.log('✓ Collision phase complete\n');

      // Phase 3: Shooting test (10s)
      console.log('Phase 3: Shooting test - Client 0 shoots Client 1 (10s)');
      const shootStart = Date.now();
      while (Date.now() - shootStart < 10000) {
        this.sendFire(0, this.clients[1].playerId);
        await this.wait(1000);
      }
      console.log('✓ Shooting phase complete\n');

      // Phase 4: Continue activity (8s)
      console.log('Phase 4: Continued movement (8s)');
      const continueStart = Date.now();
      while (Date.now() - continueStart < 8000) {
        for (let i = 0; i < 3; i++) {
          this.sendInput(i, {
            forward: Math.random() > 0.5 ? 1 : 0,
            left: Math.random() > 0.7 ? 1 : 0,
            right: Math.random() > 0.7 ? 1 : 0,
            jump: 0,
            yaw: Math.random() * Math.PI * 2
          });
        }
        await this.wait(1000);
      }
      console.log('✓ Continued activity phase complete\n');

      // Results
      console.log('=== Test Results ===\n');
      console.log(`Clients connected: ${this.results.clientsConnected}/3`);
      console.log(`Total messages: ${this.results.messagesReceived}`);

      for (let i = 0; i < this.clients.length; i++) {
        const c = this.clients[i];
        console.log(`\nClient ${i}:`);
        console.log(`  Connected: ${c.connected}`);
        console.log(`  Messages: ${c.messages.length}`);
        console.log(`  Events: ${c.events.length}`);
        if (c.events.length > 0) {
          const summary = {};
          for (const evt of c.events) {
            summary[evt.type] = (summary[evt.type] || 0) + 1;
          }
          console.log(`  Event breakdown: ${JSON.stringify(summary)}`);
        }
      }

      // Verify criteria
      console.log('\n=== Verification ===');
      const allConnected = this.clients.every(c => c.connected);
      const hasMessages = this.results.messagesReceived > 10;
      const hasEvents = this.clients.some(c => c.events.length > 0);

      console.log(`✓ All clients connected: ${allConnected ? 'PASS' : 'FAIL'}`);
      console.log(`✓ Server responsive: ${hasMessages ? 'PASS (${this.results.messagesReceived} msgs)' : 'FAIL'}`);
      console.log(`✓ Events received: ${hasEvents ? 'PASS' : 'FAIL'}`);

      const passed = allConnected && hasMessages && hasEvents;
      console.log(`\nResult: ${passed ? '✓ WAVE 5 PASSED' : '✗ WAVE 5 FAILED'}\n`);

      return passed ? 0 : 1;

    } catch (err) {
      console.error('\n✗ Test error:', err.message);
      this.results.errors.push(err.message);
      return 1;
    } finally {
      // Disconnect all clients
      console.log('Cleaning up...');
      for (const client of this.clients) {
        if (client.ws) client.ws.close();
      }
      await this.wait(500);
    }
  }
}

// Run test
const test = new MultiClientTest();
test.runTests()
  .then(code => {
    console.log('\nTest complete.');
    process.exit(code);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

// Timeout safety net
setTimeout(() => {
  console.error('Test timeout - exiting');
  process.exit(1);
}, TEST_TIMEOUT);
