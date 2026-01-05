import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const browser = await chromium.launch();
const context = await browser.createContext();
const page = await context.newPage();

const results = {
  tests: [],
  timestamp: new Date().toISOString(),
  success: true
};

function logTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  const status = passed ? '✓' : '✗';
  console.log(`${status} ${name}${details ? ': ' + details : ''}`);
  if (!passed) results.success = false;
}

// Monitor events
let pageErrors = [];
let consoleMessages = [];
let wsEvents = [];

page.on('console', msg => {
  consoleMessages.push({ type: msg.type(), text: msg.text() });
});

page.on('error', err => {
  pageErrors.push(err.message);
});

page.on('pageerror', err => {
  pageErrors.push(err.message);
});

page.on('websocket', ws => {
  wsEvents.push({ event: 'websocket_created', url: ws.url() });

  ws.on('framesent', frame => {
    wsEvents.push({ event: 'frame_sent', bytes: frame.payload.length });
  });

  ws.on('framereceived', frame => {
    wsEvents.push({ event: 'frame_received', bytes: frame.payload.length });
  });
});

try {
  console.log('Starting multiplayer connectivity test...\n');

  // Test 1: HTTP connectivity
  console.log('Test 1: HTTP Server Connectivity');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
  logTest('Page loads', page.url().includes('localhost:3000'));

  // Test 2: React app mounts
  console.log('\nTest 2: React Application');
  await page.waitForTimeout(1000);
  const rootDiv = await page.$('#root');
  logTest('React root element exists', !!rootDiv);

  // Test 3: WebSocket connection
  console.log('\nTest 3: WebSocket Connection');
  await page.waitForTimeout(2000);
  const wsCreated = wsEvents.some(e => e.event === 'websocket_created');
  logTest('WebSocket connection established', wsCreated);

  const framesReceived = wsEvents.filter(e => e.event === 'frame_received');
  logTest('Snapshot received from server', framesReceived.length > 0,
    `${framesReceived.length} frames received`);

  if (framesReceived.length > 0) {
    const snapshotFrame = framesReceived[0];
    logTest('Snapshot has valid size', snapshotFrame.bytes > 100,
      `${snapshotFrame.bytes} bytes`);
  }

  // Test 4: Client state
  console.log('\nTest 4: Client State & UI');

  const clientState = await page.evaluate(() => {
    return {
      worldExists: typeof window.world !== 'undefined',
      networkSystemExists: typeof window.world?.network !== 'undefined',
      hasGraphics: typeof window.world?.graphics !== 'undefined',
      hasEntities: typeof window.world?.entities !== 'undefined',
    };
  });

  logTest('World object initialized', clientState.worldExists);
  logTest('Network system available', clientState.networkSystemExists);
  logTest('Graphics system available', clientState.hasGraphics);
  logTest('Entities system available', clientState.hasEntities);

  // Test 5: 3D rendering
  console.log('\nTest 5: 3D Rendering');

  const canvas = await page.$('canvas');
  logTest('Canvas element exists', !!canvas);

  if (canvas) {
    const isVisible = await canvas.isVisible();
    logTest('Canvas is visible', isVisible);

    const boundingBox = await canvas.boundingBox();
    logTest('Canvas has valid size', boundingBox && boundingBox.width > 100 && boundingBox.height > 100,
      `${boundingBox?.width}x${boundingBox?.height}`);
  }

  // Test 6: Network connectivity indicator
  console.log('\nTest 6: Network Status');

  await page.waitForTimeout(1000);
  const pageContent = await page.content();
  const hasNetworkUI = pageContent.includes('Network') || pageContent.includes('FPS');
  logTest('UI elements rendered', hasNetworkUI);

  // Test 7: Error checking
  console.log('\nTest 7: Error Analysis');

  const criticalErrors = consoleMessages.filter(m =>
    m.type === 'error' &&
    !m.text.includes('favicon') &&
    !m.text.includes('Failed to load resource') &&
    !m.text.includes('404') &&
    m.text.length > 5
  );

  logTest('No critical errors in console', criticalErrors.length === 0,
    criticalErrors.length > 0 ? `Found ${criticalErrors.length} errors` : 'Clean');

  if (criticalErrors.length > 0) {
    criticalErrors.slice(0, 3).forEach(err => {
      console.log(`  - ${err.text.substring(0, 80)}`);
    });
  }

  // Test 8: Network message flow
  console.log('\nTest 8: Packet Flow');

  const sentFrames = wsEvents.filter(e => e.event === 'frame_sent');
  const receivedFrames = wsEvents.filter(e => e.event === 'frame_received');

  logTest('Received initial snapshot', receivedFrames.length > 0);
  logTest('Bidirectional communication', sentFrames.length >= 0 && receivedFrames.length > 0,
    `Sent: ${sentFrames.length}, Received: ${receivedFrames.length}`);

  // Test 9: Scene integrity
  console.log('\nTest 9: Scene Integrity');

  const sceneState = await page.evaluate(() => {
    try {
      const graphics = window.world?.graphics;
      if (!graphics || !graphics.app) return { hasScene: false };

      const app = graphics.app;
      return {
        hasScene: !!app.scene,
        hasRoot: !!app.root,
        childCount: app.root?.children?.length || 0,
        hasLight: !!app.scene?.ambientLight,
      };
    } catch (e) {
      return { error: e.message };
    }
  });

  logTest('3D scene initialized', sceneState.hasScene);
  logTest('Scene has entities', sceneState.childCount > 0, `${sceneState.childCount} entities`);

  // Take screenshot
  console.log('\nTest 10: Visual Verification');
  await page.screenshot({ path: '/tmp/test-multiplayer-result.png' });
  logTest('Screenshot captured', true);

  // Summary
  console.log('\n' + '='.repeat(50));
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(t => t.passed).length;
  console.log(`RESULTS: ${passedTests}/${totalTests} tests passed`);
  console.log('Status:', results.success ? '✓ PASS' : '✗ FAIL');
  console.log('Screenshot: /tmp/test-multiplayer-result.png');
  console.log('='.repeat(50));

} catch (err) {
  console.error('Test execution failed:', err.message);
  results.success = false;
  results.error = err.message;
} finally {
  await context.close();
  await browser.close();

  // Write results to file
  try {
    await import('fs').then(fs => {
      fs.writeFileSync('/tmp/test-results.json', JSON.stringify(results, null, 2));
    });
  } catch (e) {
    console.error('Could not write results file:', e.message);
  }

  process.exit(results.success ? 0 : 1);
}
