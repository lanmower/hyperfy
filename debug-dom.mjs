import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));

  console.log('Loading page...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Waiting for load...');
  await page.waitForTimeout(3000);

  const html = await page.content();
  writeFileSync('/c/dev/hyperfy/debug-page.html', html);

  const dom = await page.evaluate(() => {
    const root = document.getElementById('root');
    const getTree = (el, depth = 0) => {
      const indent = '  '.repeat(depth);
      const tag = el.tagName?.toLowerCase() || el.nodeName;
      const id = el.id ? ` id="${el.id}"` : '';
      const classes = el.className ? ` class="${el.className}"` : '';
      const style = el.style.cssText ? ` style="${el.style.cssText}"` : '';
      const text = el.textContent?.trim().substring(0, 30) || '';
      const textStr = text ? ` (text: "${text}...")` : '';

      const result = `${indent}<${tag}${id}${classes}${style}>${textStr}\n`;

      if (el.children && depth < 6) {
        return result + Array.from(el.children).map(c => getTree(c, depth + 1)).join('');
      }
      return result;
    };

    return {
      rootExists: !!root,
      rootDisplay: root?.style.display,
      rootChildren: root?.children.length,
      tree: getTree(root),
      viewport: document.querySelector('[class*="viewport"]'),
      canvas: document.querySelector('canvas'),
      canvasStyle: document.querySelector('canvas')?.style.cssText,
    };
  });

  console.log('\n=== DOM STRUCTURE ===');
  console.log(JSON.stringify(dom, null, 2));
  console.log('\n=== DOM TREE ===');
  console.log(dom.tree);

  console.log('\nHTML saved to /c/dev/hyperfy/debug-page.html');

  // Take screenshot
  await page.screenshot({ path: '/c/dev/hyperfy/debug-page.png', fullPage: true });
  console.log('Screenshot saved to /c/dev/hyperfy/debug-page.png');

  await browser.close();
})();
