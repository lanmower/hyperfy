import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const networkErrors = [];

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`Network error: ${response.url()} - ${response.status()}`);
      networkErrors.push({url: response.url(), status: response.status()});
    }
  });

  page.on('error', err => {
    console.error(`Page error: ${err.message}`);
  });

  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log(`[${msg.type()}] ${text}`);
    consoleMessages.push({type: msg.type(), text});
  });

  await page.goto('http://localhost:3002', { waitUntil: 'domcontentloaded' });

  // Wait for scripts to load
  await page.waitForTimeout(3000);

  // Get all script tags
  const scripts = await page.evaluate(() => {
    return Array.from(document.scripts).map(s => ({
      src: s.src,
      type: s.type,
      loaded: s.status === 200 || s.status === undefined
    }));
  });

  console.log('\n=== SCRIPTS ===');
  scripts.forEach(s => console.log(`${s.src || '(inline)'} - type: ${s.type}`));

  // Check errors
  if (networkErrors.length > 0) {
    console.log('\n=== NETWORK ERRORS ===');
    networkErrors.forEach(e => console.log(`${e.status}: ${e.url}`));
  }

  // Get React root size
  const rootInfo = await page.evaluate(() => {
    const root = document.getElementById('root');
    if (!root) return { exists: false };
    return {
      exists: true,
      rect: root.getBoundingClientRect(),
      innerHTML: root.innerHTML
    };
  });

  console.log('\nReact root:', JSON.stringify(rootInfo, null, 2));

  // Check for errors in console
  console.log('\n=== CONSOLE MESSAGES ===');
  consoleMessages.forEach(m => {
    if (m.type !== 'log') {
      console.log(`${m.type}: ${m.text}`);
    }
  });

  await browser.close();
})();
