import { createAuthClient } from '@supabase/supabase-js'

export const supabase = createAuthClient(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
)
