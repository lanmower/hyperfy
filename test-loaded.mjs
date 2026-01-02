import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const loaded = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootExists: !!root,
      clientLoaded: root?.getAttribute('data-client-loaded'),
      hasChildren: root?.children.length > 0
    };
  });

  console.log('Loaded status:', JSON.stringify(loaded, null, 2));
  await browser.close();
})();
