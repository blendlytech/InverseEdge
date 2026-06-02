import puppeteer from 'puppeteer';

async function testScrape() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.coloradolottery.com/en/games/pick3/drawings/', { waitUntil: 'networkidle2' });
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.substring(0, 3000));
  await browser.close();
}
testScrape();
