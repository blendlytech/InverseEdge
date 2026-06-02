import puppeteer from 'puppeteer';
import fs from 'fs';

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('https://www.coloradolottery.com/en/games/pick3/drawings/', { waitUntil: 'networkidle2' });
  const html = await page.content();
  fs.writeFileSync('C:/Users/DELL/.gemini/antigravity-ide/scratch/colorado_full.html', html);
  await browser.close();
}
run();
