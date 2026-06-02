import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeLotteryNet() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const results = [];
  
  // Try May 2026
  try {
    console.log('Fetching Lottery.net May 2026...');
    await page.goto('https://www.lottery.net/colorado/pick-3/numbers/2026/05', { waitUntil: 'networkidle2' });
    const may = await page.evaluate(extractLotteryNet);
    results.push(...may);
  } catch(e) {}
  
  // Try April 2026
  try {
    console.log('Fetching Lottery.net April 2026...');
    await page.goto('https://www.lottery.net/colorado/pick-3/numbers/2026/04', { waitUntil: 'networkidle2' });
    const april = await page.evaluate(extractLotteryNet);
    results.push(...april);
  } catch(e) {}

  await browser.close();

  console.log(`Found ${results.length} draws from Lottery.net.`);
  
  for (const draw of results.slice(0, 50)) {
    const { data, error } = await supabase
      .from('lottery_draws')
      .upsert(
        { draw_date: draw.date, draw_type: draw.type, draw_number: draw.number },
        { onConflict: 'draw_date, draw_type' }
      );
    if (!error) {
      console.log(`Inserted: ${draw.date} ${draw.type} - ${draw.number}`);
    }
  }
}

function extractLotteryNet() {
    const draws = [];
    const text = document.body.innerText;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    let currentDate = null;
    let currentType = 'Evening';
    
    for (let i = 0; i < lines.length; i++) {
        // Find dates like "May 31 2026" or "Friday, May 31, 2026"
        const dateMatch = lines[i].match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i) ||
                          lines[i].match(/([A-Z][a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
                          
        if (dateMatch) {
            const m = dateMatch[1];
            const d = dateMatch[2];
            const y = dateMatch[3];
            const dateObj = new Date(`${m} ${d}, ${y}`);
            if (!isNaN(dateObj)) {
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                currentDate = `${yyyy}-${mm}-${dd}`;
            }
        }
        
        if (lines[i].toLowerCase().includes('midday')) currentType = 'Midday';
        if (lines[i].toLowerCase().includes('evening')) currentType = 'Evening';
        
        // Match numbers "5 6 7" or "567"
        if (currentDate) {
           let num = lines[i].replace(/[- ]/g, '');
           if (/^\d{3}$/.test(num)) {
               draws.push({ date: currentDate, type: currentType, number: num });
               currentDate = null; // reset to avoid duplicates
           }
        }
    }
    return draws;
}

scrapeLotteryNet().catch(console.error);
