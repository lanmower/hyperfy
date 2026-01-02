import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const allMessages = [];

  page.on('console', msg => {
    allMessages.push({type: msg.type(), text: msg.text()});
  });

  page.on('error', err => {
    console.error('Page error:', err);
  });

  page.on('pageerror', err => {
    console.error('Uncaught error:', err);
  });

  // Enable verbose logging
  await page.evaluate(() => {
    window.VERBOSE = true;
    console.log('Verbose mode enabled');
  });

  console.log('Navigating...');
  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });
  console.log('Page loaded');

  await page.waitForTimeout(5000);

  console.log(`\nTotal console messages: ${allMessages.length}`);
  allMessages.forEach(m => {
    console.log(`[${m.type}] ${m.text}`);
  });

  // Try to evaluate if index.js was loaded
  const result = await page.evaluate(() => {
    return {
      verbose: window.VERBOSE,
      envExists: !!window.env,
      envValue: window.env
    };
  });

  console.log('\nWindow state:', JSON.stringify(result, null, 2));

  await browser.close();
})();
