import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clean() {
  const { data, error } = await supabase
    .from('lottery_draws')
    .delete()
    .lt('draw_date', '2026-06-01');

  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Successfully deleted fake historical data.');
  }
}

clean();
