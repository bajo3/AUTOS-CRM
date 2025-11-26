// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Esto va a tirar un error más claro que el de la lib
  throw new Error(
    'Faltan variables EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY. Configuralas en .env o app.json.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
