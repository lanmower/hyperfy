import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('error', err => {
    console.error('Page error:', err);
    errors.push(err.message);
  });

  await page.goto('http://localhost:3002', { waitUntil: 'domcontentloaded' });

  // Wait longer for bundle to load and init
  await page.waitForTimeout(5000);

  // Check for canvas
  const canvases = await page.locator('canvas');
  const canvasCount = await canvases.count();
  console.log(`\nFound ${canvasCount} canvas elements`);

  // Check for THREE
  const hasThree = await page.evaluate(() => typeof window.THREE !== 'undefined');
  console.log(`window.THREE available: ${hasThree}`);

  // Check for world
  const hasWorld = await page.evaluate(() => typeof window.world !== 'undefined');
  console.log(`window.world available: ${hasWorld}`);

  // Get world state
  if (await page.evaluate(() => typeof window.world !== 'undefined')) {
    const state = await page.evaluate(() => ({
      hasUI: window.world?.ui !== undefined,
      isClient: window.world?.isClient,
      initialized: window.world?.initialized
    }));
    console.log(`World state:`, state);
  }

  // Check body
  const bodyContent = await page.evaluate(() => document.body.outerHTML.substring(0, 1000));
  console.log(`Body HTML: ${bodyContent}`);

  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.error(e));
  }

  await page.screenshot({ path: 'hyperfy-screenshot.png' });
  console.log('\nScreenshot saved');

  await browser.close();
})();
