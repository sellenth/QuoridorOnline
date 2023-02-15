import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Database } from './db-types'
export const createBrowserClient = () => createBrowserSupabaseClient<Database>()
