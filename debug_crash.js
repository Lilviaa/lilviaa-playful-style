const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()} ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[NETWORK FAIL] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Type credentials
    await page.type('input[type="email"]', 'owner@lilviaa.com');
    await page.type('input[type="password"]', 'Password123!');
    
    // Click submit and wait for network idle instead of navigation
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));

    console.log("[STATUS] Logged in. Current URL:", page.url());
    
    await page.goto('http://localhost:8080/admin/coupons', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log("[STATUS] Loaded /admin/coupons");
    await page.screenshot({ path: '/tmp/screenshot.png' });
    console.log("[STATUS] Screenshot saved to /tmp/screenshot.png");

  } catch (e) {
    console.log(`[PUPPETEER ERROR] ${e.message}`);
  }

  const html = await page.content();
  if (html.includes("This page didn't load")) {
    console.log("[STATUS] Page shows ErrorComponent");
  }

  await browser.close();
})();
