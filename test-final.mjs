import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const errors = [];
  let logMessages = '';

  page.on('console', msg => {
    const text = msg.text();
    logMessages += `[${msg.type()}] ${text}\n`;
    if (msg.type() !== 'log') {
      console.log(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    }
  });

  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });

  // Wait for initialization
  await page.waitForTimeout(5000);

  // Check canvas
  const canvasInfo = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    return {
      count: canvases.length,
      details: Array.from(canvases).map(c => ({
        width: c.width,
        height: c.height,
        visible: c.offsetHeight > 0
      }))
    };
  });

  console.log('\n=== CANVAS INFO ===');
  console.log(`Canvas count: ${canvasInfo.count}`);
  canvasInfo.details.forEach((d, i) => {
    console.log(`Canvas ${i}: ${d.width}x${d.height}, visible: ${d.visible}`);
  });

  // Check world
  const worldInfo = await page.evaluate(() => {
    const debug = window.__DEBUG__;
    if (!debug) return { hasDebug: false };
    const world = debug.world;
    if (!world) return { hasDebug: true, hasWorld: false };
    return {
      hasDebug: true,
      hasWorld: true,
      isClient: world.isClient,
      hasUI: !!world.ui,
      systemCount: Object.keys(world.systems || {}).length
    };
  });

  console.log('\n=== WORLD INFO ===');
  console.log(JSON.stringify(worldInfo, null, 2));

  // Check React root
  const rootInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      hasChildren: root?.children.length > 0,
      height: root?.getBoundingClientRect().height
    };
  });

  console.log('\n=== REACT ROOT ===');
  console.log(JSON.stringify(rootInfo, null, 2));

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.error(e));
  }

  await page.screenshot({ path: 'hyperfy-final.png' });
  console.log('\nScreenshot saved to hyperfy-final.png');

  await browser.close();
})();
