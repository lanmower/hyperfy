import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const responses = [];

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('/index') || url.includes('/env') || url.includes('localhost')) {
      responses.push({url, status});
      console.log(`${status} ${url}`);
    }
  });

  await page.goto('http://localhost:3003', { waitUntil: 'domcontentloaded' });

  // Wait and check for errors during network request
  await page.waitForTimeout(3000);

  console.log('\n=== RESPONSE SUMMARY ===');
  responses.forEach(r => {
    console.log(`${r.status}: ${r.url}`);
  });

  // Try executing JavaScript directly
  try {
    const result = await page.evaluate(() => {
      return 'JavaScript execution works';
    });
    console.log(`\nJavaScript execution: ${result}`);
  } catch (err) {
    console.error(`JavaScript execution failed: ${err.message}`);
  }

  // Try to check the root element more thoroughly
  const rootState = await page.evaluate(() => {
    const root = document.getElementById('root');
    const allScripts = Array.from(document.scripts);
    return {
      rootExists: !!root,
      scriptCount: allScripts.length,
      scriptSrcs: allScripts.map(s => s.src).filter(s => s),
      bodyHTML: document.body.innerHTML.substring(0, 300)
    };
  });

  console.log('\n=== ROOT STATE ===');
  console.log(JSON.stringify(rootState, null, 2));

  await browser.close();
})();
