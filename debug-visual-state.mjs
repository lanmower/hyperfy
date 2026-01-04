import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const state = await page.evaluate(() => {
    const logs = [];

    logs.push('=== GLOBAL OBJECTS ===');
    logs.push('window.world exists:', !!window.world);
    logs.push('window.pc exists:', !!window.pc);
    logs.push('window.hyperfy exists:', !!window.hyperfy);

    if (window.pc && window.pc.app) {
      logs.push('\n=== PLAYCANVAS APP ===');
      logs.push('app exists:', !!window.pc.app);
      logs.push('app.enabled:', window.pc.app.enabled);
      logs.push('app.isRunning:', window.pc.app.isRunning);
      logs.push('app.root:', !!window.pc.app.root);
      logs.push('app.scene:', !!window.pc.app.scene);
      logs.push('app.camera:', !!window.pc.app.camera);
    }

    if (window.world) {
      logs.push('\n=== WORLD OBJECT ===');
      logs.push('world.systems keys:', Object.keys(window.world.systems || {}).join(', '));
      logs.push('world.graphics:', !!window.world.graphics);
      logs.push('world.stage:', !!window.world.stage);
      logs.push('world.entities:', !!window.world.entities);
      logs.push('world.camera:', !!window.world.camera);
    }

    const canvas = document.querySelector('canvas');
    logs.push('\n=== CANVAS ===');
    logs.push('canvas found:', !!canvas);
    if (canvas) {
      logs.push('canvas size:', `${canvas.width}x${canvas.height}`);
      logs.push('canvas displayed:', canvas.style.display !== 'none');
      logs.push('canvas offset parent:', canvas.offsetParent ? 'visible' : 'hidden');

      const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
      logs.push('WebGL context:', !!ctx);
    }

    logs.push('\n=== DOM ===');
    logs.push('root div:', !!document.getElementById('root'));
    logs.push('viewport div:', !!document.querySelector('[class*="viewport"]'));

    return logs;
  });

  console.log(state.join('\n'));

  // Take a screenshot
  await page.screenshot({ path: '/c/dev/hyperfy/debug-visual.png' });
  console.log('\nScreenshot saved to: /c/dev/hyperfy/debug-visual.png');

  // Get console output
  page.on('console', msg => console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`));

  await page.waitForTimeout(3000);
  await browser.close();
})();
