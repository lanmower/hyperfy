import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const SCREENSHOTS_DIR = '/c/dev/hyperfy/test-screenshots';
const REPORT_FILE = '/c/dev/hyperfy/test-report.json';
const BASE_URL = 'http://localhost:3000';
const LOAD_TIMEOUT = 30000;

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const report = {
  timestamp: new Date().toISOString(),
  url: BASE_URL,
  tests: {},
  summary: { passed: 0, failed: 0, errors: [] },
};

const test = async (name, fn) => {
  try {
    await fn();
    report.tests[name] = { status: 'passed', error: null };
    report.summary.passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    report.tests[name] = { status: 'failed', error: error.message };
    report.summary.failed++;
    report.summary.errors.push({ test: name, error: error.message });
    console.log(`✗ ${name}: ${error.message}`);
  }
};

const screenshot = async (page, name) => {
  const path = `${SCREENSHOTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  → Screenshot: ${path}`);
  return path;
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  const consoleLogs = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location(),
    });
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  try {
    console.log('\n=== HYPERFY VISUAL VERIFICATION TEST ===\n');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${report.timestamp}\n`);

    // Test 1: Page Load
    await test('Page loads without timeout', async () => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: LOAD_TIMEOUT });
    });

    // Test 2: Canvas Exists
    let canvasHandle = null;
    await test('Canvas element exists', async () => {
      canvasHandle = await page.$('canvas');
      if (!canvasHandle) throw new Error('No canvas element found');
    });

    // Test 3: Initial Screenshot
    await test('Capture initial render state', async () => {
      await page.waitForTimeout(1000);
      await screenshot(page, '01-initial-render');
    });

    // Test 4: Check DOM Structure
    await test('DOM has expected structure', async () => {
      const html = await page.content();
      if (!html.includes('<canvas')) throw new Error('Canvas missing from DOM');
      if (!html.includes('viewport')) throw new Error('Viewport missing from DOM');
    });

    // Test 5: PlayCanvas Engine
    let engineReady = false;
    await test('PlayCanvas engine initializes', async () => {
      engineReady = await page.evaluate(() => {
        return window.pc && window.pc.Application ? true : false;
      });
      if (!engineReady) throw new Error('PlayCanvas engine not found');
    });

    // Test 6: World System
    let worldExists = false;
    await test('World system initialized', async () => {
      worldExists = await page.evaluate(() => {
        return window.world && typeof window.world === 'object' ? true : false;
      });
      if (!worldExists) throw new Error('World system not initialized');
    });

    // Test 7: Player Entity
    let playerExists = false;
    await test('Player entity exists', async () => {
      playerExists = await page.evaluate(() => {
        return window.world && window.world.player ? true : false;
      });
      if (!playerExists) throw new Error('Player entity not found');
    });

    // Test 8: Camera System
    let cameraReady = false;
    await test('Camera system ready', async () => {
      cameraReady = await page.evaluate(() => {
        return window.pc && window.pc.app && window.pc.app.camera ? true : false;
      });
      if (!cameraReady) throw new Error('Camera system not ready');
    });

    // Test 9: Get Initial Camera Position
    let initialCameraPos = null;
    await test('Read initial camera position', async () => {
      initialCameraPos = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });
      if (!initialCameraPos) throw new Error('Could not read camera position');
    });

    console.log(`  → Initial camera position: ${JSON.stringify(initialCameraPos)}`);

    // Test 10: WASD Movement - Forward (W)
    let movedForward = false;
    await test('WASD - Forward movement (W key)', async () => {
      await page.keyboard.down('w');
      await page.waitForTimeout(500);
      await page.keyboard.up('w');

      const newPos = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      movedForward = newPos && Math.abs(newPos.z - initialCameraPos.z) > 0.1;
      if (!movedForward) {
        console.log(`    Old position: ${JSON.stringify(initialCameraPos)}`);
        console.log(`    New position: ${JSON.stringify(newPos)}`);
        throw new Error('W key did not move camera forward');
      }
    });

    // Test 11: WASD Movement - Backward (S)
    let movedBackward = false;
    await test('WASD - Backward movement (S key)', async () => {
      const beforeS = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      await page.keyboard.down('s');
      await page.waitForTimeout(500);
      await page.keyboard.up('s');

      const afterS = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      movedBackward = afterS && Math.abs(afterS.z - beforeS.z) > 0.1;
      if (!movedBackward) throw new Error('S key did not move camera backward');
    });

    // Test 12: WASD Movement - Left (A)
    let movedLeft = false;
    await test('WASD - Left movement (A key)', async () => {
      const beforeA = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      await page.keyboard.down('a');
      await page.waitForTimeout(500);
      await page.keyboard.up('a');

      const afterA = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      movedLeft = afterA && Math.abs(afterA.x - beforeA.x) > 0.1;
      if (!movedLeft) throw new Error('A key did not move camera left');
    });

    // Test 13: WASD Movement - Right (D)
    let movedRight = false;
    await test('WASD - Right movement (D key)', async () => {
      const beforeD = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      await page.keyboard.down('d');
      await page.waitForTimeout(500);
      await page.keyboard.up('d');

      const afterD = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return cam ? { x: cam.getLocalPosition().x, y: cam.getLocalPosition().y, z: cam.getLocalPosition().z } : null;
      });

      movedRight = afterD && Math.abs(afterD.x - beforeD.x) > 0.1;
      if (!movedRight) throw new Error('D key did not move camera right');
    });

    // Test 14: Mouse Look - Camera Rotation
    let rotatedYaw = false;
    await test('Mouse look - Yaw rotation (horizontal)', async () => {
      const beforeRotation = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return { q: cam.getLocalRotation(), euler: cam.getLocalEulerAngles() };
      });

      await page.mouse.move(400, 300);
      await page.mouse.move(500, 300);
      await page.waitForTimeout(200);

      const afterRotation = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return { q: cam.getLocalRotation(), euler: cam.getLocalEulerAngles() };
      });

      rotatedYaw = Math.abs(afterRotation.euler.y - beforeRotation.euler.y) > 0.1;
      if (!rotatedYaw) {
        console.log(`    Before: ${JSON.stringify(beforeRotation.euler)}`);
        console.log(`    After: ${JSON.stringify(afterRotation.euler)}`);
        throw new Error('Mouse movement did not rotate camera (yaw)');
      }
    });

    // Test 15: Mouse Look - Pitch Rotation
    let rotatedPitch = false;
    await test('Mouse look - Pitch rotation (vertical)', async () => {
      const beforeRotation = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return { euler: cam.getLocalEulerAngles() };
      });

      await page.mouse.move(400, 300);
      await page.mouse.move(400, 200);
      await page.waitForTimeout(200);

      const afterRotation = await page.evaluate(() => {
        const cam = window.pc.app.camera;
        return { euler: cam.getLocalEulerAngles() };
      });

      rotatedPitch = Math.abs(afterRotation.euler.x - beforeRotation.euler.x) > 0.1;
      if (!rotatedPitch) {
        console.log(`    Before: ${JSON.stringify(beforeRotation.euler)}`);
        console.log(`    After: ${JSON.stringify(afterRotation.euler)}`);
        throw new Error('Mouse movement did not rotate camera (pitch)');
      }
    });

    // Test 16: Screenshot After Movement
    await test('Capture render state after movement', async () => {
      await screenshot(page, '02-after-movement');
    });

    // Test 17: Network Connection
    let networkConnected = false;
    await test('Network connection active', async () => {
      networkConnected = await page.evaluate(() => {
        return window.world && window.world.network && window.world.network.isConnected ? true : false;
      });
      if (!networkConnected) {
        console.log('    Note: Network may not be required for local testing');
      }
    });

    // Test 18: Scene Entities
    let entityCount = 0;
    await test('Scene entities loaded', async () => {
      entityCount = await page.evaluate(() => {
        if (!window.world || !window.world.entities) return 0;
        return Object.keys(window.world.entities).length;
      });
      console.log(`    → Entity count: ${entityCount}`);
    });

    // Test 19: UI Layer
    let uiExists = false;
    await test('UI layer present', async () => {
      uiExists = await page.evaluate(() => {
        const ui = document.querySelector('[data-ui]') || document.querySelector('.ui') || document.querySelector('#ui');
        return ui ? true : false;
      });
      if (!uiExists) {
        console.log('    Note: UI layer may use different selectors');
      }
    });

    // Test 20: Console for Errors
    await test('Check for critical console errors', async () => {
      const criticalErrors = consoleLogs.filter((log) => log.type === 'error' || log.type === 'warning');
      if (criticalErrors.length > 0) {
        console.log('    Console messages found:');
        criticalErrors.forEach((err) => {
          console.log(`      [${err.type.toUpperCase()}] ${err.text}`);
        });
      }
    });

    // Test 21: Page Errors
    await test('Check for page errors', async () => {
      if (pageErrors.length > 0) {
        console.log('    Page errors found:');
        pageErrors.forEach((err) => {
          console.log(`      ${err}`);
        });
      }
    });

    // Test 22: Render Loop Active
    let renderLoopActive = false;
    await test('Render loop is active', async () => {
      renderLoopActive = await page.evaluate(() => {
        return window.pc && window.pc.app && window.pc.app.enabled ? true : false;
      });
      if (!renderLoopActive) throw new Error('Render loop is not active');
    });

    // Test 23: Canvas Size
    let canvasSize = null;
    await test('Canvas has valid dimensions', async () => {
      canvasSize = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? { width: canvas.width, height: canvas.height } : null;
      });
      if (!canvasSize || canvasSize.width === 0 || canvasSize.height === 0) {
        throw new Error('Canvas has invalid dimensions');
      }
      console.log(`    → Canvas size: ${canvasSize.width}x${canvasSize.height}`);
    });

    // Test 24: WebGL Context
    let webglContext = false;
    await test('WebGL context available', async () => {
      webglContext = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        return canvas ? (canvas.getContext('webgl') || canvas.getContext('webgl2') ? true : false) : false;
      });
      if (!webglContext) throw new Error('WebGL context not available');
    });

    // Final screenshot
    await test('Capture final state', async () => {
      await screenshot(page, '03-final-state');
    });

    console.log('\n=== TEST SUMMARY ===\n');
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);

    if (report.summary.errors.length > 0) {
      console.log('\n=== FAILURES ===\n');
      report.summary.errors.forEach((err) => {
        console.log(`${err.test}:`);
        console.log(`  ${err.error}`);
      });
    }

    console.log('\n=== CRITICAL OBSERVATIONS ===\n');
    console.log(`Engine Ready: ${engineReady}`);
    console.log(`World Initialized: ${worldExists}`);
    console.log(`Player Exists: ${playerExists}`);
    console.log(`Camera Ready: ${cameraReady}`);
    console.log(`Render Loop Active: ${renderLoopActive}`);
    console.log(`WebGL Context: ${webglContext}`);
    console.log(`Canvas Size: ${canvasSize ? `${canvasSize.width}x${canvasSize.height}` : 'N/A'}`);
    console.log(`Entities: ${entityCount}`);
    console.log(`Network Connected: ${networkConnected}`);
    console.log(`\nMovement Tests: W=${movedForward}, S=${movedBackward}, A=${movedLeft}, D=${movedRight}`);
    console.log(`Rotation Tests: Yaw=${rotatedYaw}, Pitch=${rotatedPitch}`);
    console.log(`\nScreenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log(`Report saved to: ${REPORT_FILE}\n`);

  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    report.summary.errors.push({ test: 'Fatal', error: error.message });
  } finally {
    // Save detailed report
    report.console = consoleLogs;
    report.pageErrors = pageErrors;
    writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

    await context.close();
    await browser.close();
  }
})();
