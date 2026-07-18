import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  console.log('Navigating...');
  await page.goto('http://localhost:5175/admin/products').catch(e => console.log('Failed:', e.message));
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Done.');
  await browser.close();
})();
