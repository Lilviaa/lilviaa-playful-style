import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  await page.goto('http://localhost:5173/shop', { waitUntil: 'networkidle0' });
  
  const content = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  console.log("PAGE TEXT CONTAINS 'Nothing here yet':", content.includes('Nothing here yet'));
  console.log("PAGE TEXT CONTAINS 'products':", content.match(/(\d+) products/)?.[0]);
  
  await browser.close();
})();
