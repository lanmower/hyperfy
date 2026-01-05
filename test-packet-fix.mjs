import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.createContext();
const page = await context.newPage();

let wsMessages = [];
let consoleLogs = [];

page.on('console', msg => {
  consoleLogs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location().url
  });
});

page.on('websocket', ws => {
  console.log('WebSocket opened:', ws.url());

  ws.on('framereceived', frame => {
    wsMessages.push({
      type: 'received',
      payloadLength: frame.payload.length,
      timestamp: Date.now()
    });
    console.log('WS frame received, bytes:', frame.payload.length);
  });

  ws.on('framesent', frame => {
    wsMessages.push({
      type: 'sent',
      payloadLength: frame.payload.length,
      timestamp: Date.now()
    });
    console.log('WS frame sent, bytes:', frame.payload.length);
  });
});

try {
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });

  console.log('Page loaded, waiting for WebSocket connection...');
  await page.waitForTimeout(3000);

  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);

  // Check for network status in UI
  const networkStatus = await page.evaluate(() => {
    const statusElements = document.querySelectorAll('*');
    for (const el of statusElements) {
      if (el.textContent.includes('Network:')) {
        return el.textContent;
      }
    }
    return 'Network status not found';
  });

  console.log('Network status in UI:', networkStatus);

  // Check console for errors
  const errors = consoleLogs.filter(log => log.type === 'error');
  console.log('\nConsole errors found:', errors.length);
  errors.slice(0, 5).forEach(err => {
    console.log('  -', err.text);
  });

  // Check WebSocket messages
  console.log('\nWebSocket messages:');
  console.log('  Total messages:', wsMessages.length);
  const receivedMessages = wsMessages.filter(m => m.type === 'received');
  console.log('  Received frames:', receivedMessages.length);
  if (receivedMessages.length > 0) {
    const sizes = receivedMessages.map(m => m.payloadLength);
    console.log('  Sizes:', sizes.slice(0, 3).join(', ') + (sizes.length > 3 ? '...' : ''));
  }

  // Take a screenshot
  await page.screenshot({ path: '/tmp/packet-fix-test.png' });
  console.log('\nScreenshot saved to /tmp/packet-fix-test.png');

  // Evaluate if the connection looks healthy
  const isConnected = networkStatus.includes('Connected') || !networkStatus.includes('Disconnected');
  const hasNoErrors = errors.length === 0;
  const hasWSMessages = wsMessages.length > 0;

  console.log('\n=== RESULT ===');
  console.log('Connection healthy:', isConnected);
  console.log('No critical errors:', hasNoErrors);
  console.log('WebSocket active:', hasWSMessages);
  console.log('Status:', (isConnected && hasWSMessages) ? '✓ PASS' : '✗ FAIL');

} catch (err) {
  console.error('Test failed:', err.message);
} finally {
  await context.close();
  await browser.close();
}
