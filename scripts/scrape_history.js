import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeHistory() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const results = [];

  // Scrape May 2026
  console.log('Scraping May 2026...');
  await page.goto('https://www.coloradolottery.com/en/games/pick3/drawings/?month=5&year=2026', { waitUntil: 'networkidle2' });
  const mayResults = await page.evaluate(extractResults);
  results.push(...mayResults);

  // Scrape April 2026
  console.log('Scraping April 2026...');
  await page.goto('https://www.coloradolottery.com/en/games/pick3/drawings/?month=4&year=2026', { waitUntil: 'networkidle2' });
  const aprilResults = await page.evaluate(extractResults);
  results.push(...aprilResults);

  await browser.close();

  console.log(`Found ${results.length} draws. Inserting into Supabase...`);
  
  for (const draw of results) {
    const { data, error } = await supabase
      .from('lottery_draws')
      .upsert(
        { draw_date: draw.date, draw_type: draw.type, draw_number: draw.number },
        { onConflict: 'draw_date, draw_type' }
      );
      
    if (error) {
      console.error(`Error inserting ${draw.date} ${draw.type}:`, error);
    } else {
      console.log(`Inserted: ${draw.date} ${draw.type} - ${draw.number}`);
    }
  }
}

// Function injected into browser to parse the HTML structure
function extractResults() {
  const draws = [];
  // The layout usually has lines like "May 31, 2026: Evening" followed by numbers
  const text = document.body.innerText;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  for (let i = 0; i < lines.length; i++) {
    // Look for date and type e.g. "May 31, 2026: Evening"
    const match = lines[i].match(/([A-Z][a-z]+ \d{1,2}, \d{4}):\s*(Midday|Evening)/);
    if (match) {
      const dateStr = match[1]; // "May 31, 2026"
      const type = match[2]; // "Evening"
      
      // Look ahead for the 3 numbers
      let numbers = '';
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (/^\d{3}$/.test(lines[j])) {
           numbers = lines[j];
           break;
        } else if (/^\d$/.test(lines[j])) {
           numbers += lines[j];
           if (numbers.length === 3) break;
        }
      }
      
      if (numbers.length === 3) {
        // convert "May 31, 2026" to "2026-05-31"
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        
        draws.push({ date: isoDate, type: type, number: numbers });
      }
    }
  }
  return draws;
}

scrapeHistory().catch(console.error);
