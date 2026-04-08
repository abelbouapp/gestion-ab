import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || url.includes('TU_PROJECT')) {
  console.warn('⚠️  Supabase no configurado. Edita el archivo .env con tus credenciales.')
}

export const supabase = createClient(url, key)
