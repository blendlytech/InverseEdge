import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const historicalDraws = [
  { date: '2026-05-30', draw: '984', type: 'Midday' },
  { date: '2026-05-30', draw: '958', type: 'Evening' },
  { date: '2026-05-29', draw: '938', type: 'Midday' },
  { date: '2026-05-29', draw: '735', type: 'Evening' },
  { date: '2026-05-28', draw: '954', type: 'Midday' },
  { date: '2026-05-28', draw: '864', type: 'Evening' },
  { date: '2026-05-27', draw: '765', type: 'Midday' },
  { date: '2026-05-27', draw: '978', type: 'Evening' },
  { date: '2026-05-26', draw: '875', type: 'Midday' },
  { date: '2026-05-26', draw: '986', type: 'Evening' },
  { date: '2026-05-25', draw: '754', type: 'Midday' },
  { date: '2026-05-25', draw: '943', type: 'Evening' },
  { date: '2026-05-24', draw: '865', type: 'Midday' },
  { date: '2026-05-24', draw: '764', type: 'Evening' },
  { date: '2026-05-23', draw: '963', type: 'Midday' },
  { date: '2026-05-23', draw: '854', type: 'Evening' },
  { date: '2026-05-22', draw: '763', type: 'Midday' },
  { date: '2026-05-22', draw: '974', type: 'Evening' },
  { date: '2026-05-21', draw: '853', type: 'Midday' },
  { date: '2026-05-21', draw: '957', type: 'Evening' },
  { date: '2026-05-20', draw: '863', type: 'Midday' },
  { date: '2026-05-20', draw: '753', type: 'Evening' },
  { date: '2026-05-19', draw: '946', type: 'Midday' },
  { date: '2026-05-19', draw: '843', type: 'Evening' },
  { date: '2026-05-18', draw: '754', type: 'Midday' },
  { date: '2026-05-18', draw: '935', type: 'Evening' },
  { date: '2026-05-17', draw: '654', type: 'Midday' },
  { date: '2026-05-17', draw: '852', type: 'Evening' },
  { date: '2026-05-16', draw: '743', type: 'Midday' },
  { date: '2026-05-16', draw: '965', type: 'Evening' },
  { date: '2026-05-15', draw: '865', type: 'Midday' },
  { date: '2026-05-15', draw: '976', type: 'Evening' },
  { date: '2026-05-14', draw: '732', type: 'Midday' },
  { date: '2026-05-14', draw: '653', type: 'Evening' },
  { date: '2026-05-13', draw: '952', type: 'Midday' },
  { date: '2026-05-13', draw: '842', type: 'Evening' },
  { date: '2026-05-12', draw: '643', type: 'Midday' },
  { date: '2026-05-12', draw: '765', type: 'Evening' },
  { date: '2026-05-11', draw: '942', type: 'Midday' },
  { date: '2026-05-11', draw: '852', type: 'Evening' },
  { date: '2026-05-10', draw: '543', type: 'Midday' },
  { date: '2026-05-10', draw: '932', type: 'Evening' },
  { date: '2026-05-09', draw: '632', type: 'Midday' },
  { date: '2026-05-09', draw: '760', type: 'Evening' },
  { date: '2026-05-08', draw: '873', type: 'Midday' },
  { date: '2026-05-08', draw: '973', type: 'Evening' },
  { date: '2026-05-07', draw: '874', type: 'Midday' },
  { date: '2026-05-07', draw: '654', type: 'Evening' },
  { date: '2026-05-06', draw: '976', type: 'Midday' },
  { date: '2026-05-06', draw: '876', type: 'Evening' }
];

async function runBackfill() {
  console.log(`Starting backfill of ${historicalDraws.length} past drawings into Supabase...`);
  
  for (const draw of historicalDraws) {
    const { data, error } = await supabase
      .from('lottery_draws')
      .upsert(
        { draw_date: draw.date, draw_type: draw.type, draw_number: draw.draw },
        { onConflict: 'draw_date, draw_type' }
      );
      
    if (error) {
      console.error(`Error inserting ${draw.date} ${draw.type}:`, error);
    } else {
      console.log(`Inserted: ${draw.date} ${draw.type} - ${draw.draw}`);
    }
  }
  console.log('Backfill complete!');
}

runBackfill().catch(console.error);
