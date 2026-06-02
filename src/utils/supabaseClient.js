import { createClient } from '@supabase/supabase-js';

// Since we are moving to a fully automated pipeline, we initialize the Supabase client here.
const SUPABASE_URL = 'https://ozoxtmroaabbznkaebpf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96b3h0bXJvYWFiYnpua2FlYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDQ5MjAsImV4cCI6MjA5NTQ4MDkyMH0.46cCYKUi5c8qZnUfjDKDwuqPkUJOaZmvlHD9E5BJfNw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
