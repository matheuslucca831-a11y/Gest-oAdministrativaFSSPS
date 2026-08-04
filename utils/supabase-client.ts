// utils/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ezqmhnmjlrhwljozysaq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cW1obm1qbHJod2xqb3p5c2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMxMzQsImV4cCI6MjA5NjAxOTEzNH0.egPosHPSJvAKH_iddTRfrgk1pVOJFteWHHUjQ-lDal4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);