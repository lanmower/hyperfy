import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const html = await page.content();
  const hasError = html.includes('render failed');
  const hasConsoleError = html.includes('React render failed');

  console.log(`Error message visible: ${hasError || hasConsoleError}`);

  const bodyText = await page.evaluate(() => document.body.textContent);
  if (bodyText.includes('failed')) {
    console.log('Body contains error:', bodyText.substring(0, 500));
  } else {
    console.log('No error in body');
  }

  // Check for console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Wait a bit more for console events
  await page.waitForTimeout(2000);

  console.log(`\nConsole errors: ${consoleErrors.length}`);
  consoleErrors.forEach(e => console.error(`  - ${e}`));

  await page.screenshot({ path: 'hyperfy-error-check.png' });
  await browser.close();
})();
