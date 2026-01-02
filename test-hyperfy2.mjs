import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3002', { waitUntil: 'domcontentloaded' });

  // Wait longer
  await page.waitForTimeout(6000);

  // Check for canvas with exact query
  const canvasElements = await page.evaluate(() => {
    const all = document.querySelectorAll('canvas');
    return {
      count: all.length,
      details: Array.from(all).map(c => ({
        id: c.id,
        width: c.width,
        height: c.height,
        className: c.className
      }))
    };
  });

  console.log('Canvas elements:', JSON.stringify(canvasElements, null, 2));

  // Check React root content
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      exists: !!root,
      children: root?.childNodes.length,
      innerHTML: root?.innerHTML.substring(0, 500)
    };
  });

  console.log('React root:', JSON.stringify(rootContent, null, 2));

  // Check window.DEBUG
  const debugInfo = await page.evaluate(() => {
    return {
      hasDebug: !!window.__DEBUG__,
      hasWorld: !!window.__DEBUG__?.world,
      worldState: window.__DEBUG__?.world ? {
        isClient: window.__DEBUG__.world.isClient,
        initialized: !!window.__DEBUG__.world.ui
      } : null
    };
  });

  console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

  // Try to trigger world init manually
  const initResult = await page.evaluate(async () => {
    if (window.__DEBUG__?.world) {
      return 'World exists';
    }
    return 'No world';
  });

  console.log('Init result:', initResult);

  await page.screenshot({ path: 'hyperfy-screenshot2.png' });
  console.log('Screenshot saved to hyperfy-screenshot2.png');

  await browser.close();
})();
