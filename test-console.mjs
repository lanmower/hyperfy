import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const allMessages = [];

  page.on('console', msg => {
    const text = msg.text();
    allMessages.push({type: msg.type(), text, location: msg.location()});
  });

  page.on('error', err => {
    console.error('Page error:', err.message);
  });

  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });

  // Wait longer
  await page.waitForTimeout(8000);

  console.log(`Total console messages: ${allMessages.length}`);
  console.log('\n=== ALL CONSOLE MESSAGES ===');
  allMessages.forEach(msg => {
    console.log(`[${msg.type}] ${msg.text}`);
  });

  // Try to access window.env
  const envInfo = await page.evaluate(() => {
    return {
      envExists: typeof window.env !== 'undefined',
      envValue: window.env
    };
  });

  console.log('\n=== WINDOW.ENV ===');
  console.log(JSON.stringify(envInfo, null, 2));

  await browser.close();
})();
