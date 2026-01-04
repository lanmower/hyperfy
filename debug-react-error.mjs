import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error' || text.includes('Error')) {
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log('[PAGE ERROR]', err.toString());
    logs.push({ type: 'pageerror', text: err.toString() });
  });

  console.log('Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach((log, i) => {
    if (log.type !== 'info' && log.type !== 'log') {
      console.log(`[${i}] [${log.type}] ${log.text.substring(0, 200)}`);
    }
  });

  const state = await page.evaluate(() => {
    return {
      hasRoot: !!document.getElementById('root'),
      rootHTML: document.getElementById('root')?.innerHTML?.substring(0, 500),
      hasChildren: document.getElementById('root')?.children?.length > 0,
      worldExists: !!window.world,
    };
  });

  console.log('\n=== PAGE STATE ===');
  console.log(JSON.stringify(state, null, 2));

  await browser.close();
})();
