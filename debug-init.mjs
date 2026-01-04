import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const allLogs = [];
  const allErrors = [];

  page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    allErrors.push(error.toString());
  });

  console.log('Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Waiting for initial scripts...');
  await page.waitForTimeout(3000);

  const state = await page.evaluate(() => {
    return {
      worldExists: !!window.world,
      hyperfyExists: !!window.hyperfy,
      reactExists: !!window.React,
      pcExists: !!window.pc,
      pcAppExists: !!window.pc?.app,
      documentsHasRoot: !!document.getElementById('root'),
      rootHasChildren: document.getElementById('root')?.children.length,
      canvas: document.querySelector('canvas') ? 'found' : 'not found',
    };
  });

  console.log('\n=== STATE ===');
  console.log(JSON.stringify(state, null, 2));

  console.log('\n=== CONSOLE LOGS (first 50) ===');
  allLogs.slice(0, 50).forEach((log, i) => console.log(`${i+1}. ${log}`));

  if (allLogs.length > 50) {
    console.log(`... and ${allLogs.length - 50} more logs`);
  }

  if (allErrors.length > 0) {
    console.log('\n=== ERRORS ===');
    allErrors.forEach((err, i) => console.log(`${i+1}. ${err}`));
  }

  // Check initialization logs
  const initLogs = allLogs.filter(l => l.includes('CLIENT') || l.includes('World') || l.includes('init') || l.includes('Error'));
  console.log('\n=== INIT-RELATED LOGS ===');
  initLogs.forEach(log => console.log(log));

  await browser.close();
})();
