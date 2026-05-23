import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const pages = [
    { name: 'landing', url: 'http://127.0.0.1:8000/' },
    { name: 'pricing', url: 'http://127.0.0.1:8000/pricing' },
    { name: 'tools', url: 'http://127.0.0.1:8000/tools' },
    { name: 'unlock', url: 'http://127.0.0.1:8000/tools/unlock-pdf' },
    { name: 'dashboard', url: 'http://127.0.0.1:8000/dashboard' },
    { name: 'admin', url: 'http://127.0.0.1:8000/admin' },
  ];

  for (const p of pages) {
    try {
      console.log(`Navigating to ${p.name}: ${p.url}`);
      await page.goto(p.url, { waitUntil: 'networkidle' });
      // Wait for the app to hydrate
      await page.waitForSelector('footer', { timeout: 10000 });
      await page.screenshot({ path: `${p.name}.png`, fullPage: true });
      console.log(`Captured ${p.name}.png`);
    } catch (e) {
      console.error(`Failed to capture ${p.name}: ${e.message}`);
    }
  }

  await browser.close();
})();
