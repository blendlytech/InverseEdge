import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const URL = 'https://www.coloradolottery.com/en/games/pick3/';

async function scrapePick3() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2' });

  console.log('Extracting results...');
  const results = await page.evaluate(() => {
    // We will parse the text content directly since it's reliable
    const text = document.body.innerText;
    
    // We want to find a date like "Monday, 6/1 Midday" followed by 3 numbers
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    const draws = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Midday') || lines[i].includes('Evening')) {
        const dateTypeMatch = lines[i].match(/(.+),\s*(\d+\/\d+)\s+(Midday|Evening)/);
        if (dateTypeMatch) {
          // Check next 3 lines for numbers
          if (i + 3 < lines.length) {
            const n1 = lines[i+1];
            const n2 = lines[i+2];
            const n3 = lines[i+3];
            
            // Check if they are valid digits (not '-')
            if (/^\d$/.test(n1) && /^\d$/.test(n2) && /^\d$/.test(n3)) {
              draws.push({
                dateStr: dateTypeMatch[2],
                type: dateTypeMatch[3],
                numbers: `${n1}${n2}${n3}`
              });
            }
          }
        }
      }
    }
    return draws;
  });

  console.log('Parsed Draws:', results);

  // Insert into Supabase
  for (const draw of results) {
    // Convert 6/1 to 2026-06-01 (Current year)
    const currentYear = new Date().getFullYear();
    const [month, day] = draw.dateStr.split('/');
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    const isoDate = `${currentYear}-${paddedMonth}-${paddedDay}`;

    console.log(`Inserting: ${isoDate} ${draw.type} - ${draw.numbers}`);

    const { data, error } = await supabase
      .from('lottery_draws')
      .upsert(
        { draw_date: isoDate, draw_type: draw.type, draw_number: draw.numbers },
        { onConflict: 'draw_date, draw_type' }
      );
      
    if (error) {
      console.error('Error inserting:', error);
    } else {
      console.log('Successfully inserted/updated.');
    }
  }

  await browser.close();
}

scrapePick3().catch(console.error);
