import { spawn } from 'child_process';
import WebSocket from 'ws';
import { Packr } from 'msgpackr';

const packr = new Packr();
const server = spawn('node', ['server.js'], { stdio: 'pipe' });

server.stdout.on('data', (data) => {
  console.log('[SERVER]', data.toString().trim());
});

setTimeout(async () => {
  console.log('\n=== Inspecting Message Format ===\n');
  
  const ws = new WebSocket('ws://localhost:8080/ws');
  let messageCount = 0;
  let firstMessages = [];
  
  ws.on('open', () => {
    console.log('[CLIENT] Connected');
  });
  
  ws.on('message', (rawData) => {
    messageCount++;
    
    if (messageCount <= 10) {
      try {
        const decoded = packr.unpack(rawData);
        firstMessages.push({
          index: messageCount,
          type: decoded?.type,
          isArray: Array.isArray(decoded),
          keys: !Array.isArray(decoded) && decoded ? Object.keys(decoded) : 'array',
          length: Array.isArray(decoded) ? decoded.length : 'n/a',
          firstElement: Array.isArray(decoded) ? decoded[0] : 'n/a'
        });
      } catch (e) {
        firstMessages.push({
          index: messageCount,
          error: e.message
        });
      }
    }
  });
  
  setTimeout(() => {
    console.log('First 10 messages structure:');
    firstMessages.forEach(m => {
      console.log('  ' + JSON.stringify(m));
    });
    
    console.log('\nTotal messages received: ' + messageCount);
    ws.close();
    server.kill();
    process.exit(0);
  }, 3000);
  
  setTimeout(() => {
    ws.close();
    server.kill();
    process.exit(1);
  }, 4000);
}, 2000);

setTimeout(() => {
  server.kill();
  process.exit(1);
}, 5000);
