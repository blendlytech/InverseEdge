import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeLP() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Lottery Post Colorado Pick 3 results
  await page.goto('https://www.lotterypost.com/game/291/results', { waitUntil: 'networkidle2' });
  
  const results = await page.evaluate(() => {
    const draws = [];
    // Lottery post usually has results in a list/table
    const rows = document.querySelectorAll('.resultsGrid .resultsRow');
    
    rows.forEach(row => {
      try {
        const dateEl = row.querySelector('.resultsDate');
        const drawTimeEl = row.querySelector('.resultsDrawTime');
        const nums = Array.from(row.querySelectorAll('.resultsNum')).map(n => n.innerText).join('');
        
        if (dateEl && nums.length === 3) {
           const d = new Date(dateEl.innerText);
           if (!isNaN(d)) {
             const yyyy = d.getFullYear();
             const mm = String(d.getMonth() + 1).padStart(2, '0');
             const dd = String(d.getDate()).padStart(2, '0');
             const isoDate = `${yyyy}-${mm}-${dd}`;
             
             let type = 'Evening';
             if (drawTimeEl && drawTimeEl.innerText.includes('Midday')) {
               type = 'Midday';
             }
             
             draws.push({ date: isoDate, type: type, number: nums });
           }
        }
      } catch (e) {}
    });
    
    // If we can't find `.resultsGrid`, let's just parse the body text as a fallback
    if (draws.length === 0) {
      const text = document.body.innerText;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
      let currentDate = null;
      let currentType = 'Evening';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Match things like "Monday, June 1, 2026"
        const dateMatch = line.match(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), ([A-Z][a-z]+ \d{1,2}, \d{4})/);
        if (dateMatch) {
          const d = new Date(dateMatch[1]);
          if (!isNaN(d)) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            currentDate = `${yyyy}-${mm}-${dd}`;
          }
        }
        
        if (line === 'Midday') currentType = 'Midday';
        if (line === 'Evening') currentType = 'Evening';
        
        if (currentDate && /^\d{3}$/.test(line.replace(/[- ]/g, ''))) {
            draws.push({ date: currentDate, type: currentType, number: line.replace(/[- ]/g, '') });
        } else if (currentDate && /^\d \d \d$/.test(line)) {
            draws.push({ date: currentDate, type: currentType, number: line.replace(/ /g, '') });
        }
      }
    }
    
    return draws;
  });
  
  await browser.close();
  
  console.log(`Found ${results.length} draws from Lottery Post. Inserts starting...`);
  
  let inserted = 0;
  for (const draw of results.slice(0, 50)) { // Just grab up to 50
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
      inserted++;
    }
  }
  console.log(`Finished. Inserted ${inserted} draws.`);
}

scrapeLP().catch(console.error);
