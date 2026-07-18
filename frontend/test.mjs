import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating...');
  await page.goto('http://localhost:5175/admin/products').catch(e => console.log('Failed:', e.message));
  
  console.log('Waiting for load...');
  await page.waitForTimeout(3000);
  
  console.log('Done.');
  await browser.close();
})();
