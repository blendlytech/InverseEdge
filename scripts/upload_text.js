import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadTextFile(filename) {
  if (!fs.existsSync(filename)) {
    console.error(`File ${filename} not found.`);
    return;
  }
  
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let inserted = 0;
  let currentDate = null;
  let currentType = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match "April 30, 2026: Evening" or "Feb. 28, 2026: Midday"
    const dateMatch = line.match(/([A-Z][a-z]+\.? \d{1,2}, \d{4}):\s*(Midday|Evening)/i);
    if (dateMatch) {
      const d = new Date(dateMatch[1]);
      if (!isNaN(d)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        
        currentDate = `${yyyy}-${mm}-${dd}`;
        currentType = dateMatch[2];
      }
      continue;
    }
    
    // If we have an active date and type, and we see a 3-digit number
    if (currentDate && /^\d{3}$/.test(line)) {
      const nums = line;
      
      const { error } = await supabase
        .from('lottery_draws')
        .upsert(
          { draw_date: currentDate, draw_type: currentType, draw_number: nums },
          { onConflict: 'draw_date, draw_type' }
        );
        
      if (error) {
        console.error(`Error on ${currentDate} ${currentType}:`, error);
      } else {
        console.log(`Inserted: ${currentDate} ${currentType} - ${nums}`);
        inserted++;
      }
      
      currentDate = null; // reset until next date header
      currentType = null;
    }
  }
  
  console.log(`\nSuccessfully processed and uploaded ${inserted} draws from ${filename}!`);
}

const fileToProcess = process.argv[2] || 'april_drawings.txt';
uploadTextFile(fileToProcess);
