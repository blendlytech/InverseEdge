import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadCSV() {
  const file = 'colorado_pick3_history.csv';
  if (!fs.existsSync(file)) {
    console.error(`Error: Could not find ${file}. Please download the drawing history from the Colorado Lottery website and save it in this directory.`);
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  // Assuming basic CSV format like: Date,Type,Numbers
  // Or "06/01/2026","Evening","7-5-2"
  
  let inserted = 0;
  for (let i = 1; i < lines.length; i++) { // skip header
    try {
      const parts = lines[i].split(',');
      if (parts.length >= 3) {
        const rawDate = parts[0].replace(/"/g, '');
        const typeStr = parts[1].replace(/"/g, '');
        const rawNums = parts[2].replace(/"/g, '');
        
        const d = new Date(rawDate);
        if (isNaN(d)) continue;
        
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        
        const type = typeStr.toLowerCase().includes('midday') ? 'Midday' : 'Evening';
        const nums = rawNums.replace(/[^0-9]/g, '');
        
        if (nums.length === 3) {
          const { error } = await supabase
            .from('lottery_draws')
            .upsert(
              { draw_date: isoDate, draw_type: type, draw_number: nums },
              { onConflict: 'draw_date, draw_type' }
            );
          if (!error) inserted++;
        }
      }
    } catch (e) {}
  }
  
  console.log(`Successfully uploaded ${inserted} historical draws from CSV.`);
}

uploadCSV();
