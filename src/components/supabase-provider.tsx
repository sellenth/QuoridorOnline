'use client'

import { Database } from '@/utils/db-types'
import type { Session, SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { createContext, useContext, useState } from 'react'
import { createBrowserClient } from '../utils/supabase-browser'

type MaybeSession = Session | null

export type SupabaseContext = {
  supabase: SupabaseClient<Database>
  session: MaybeSession
}

// @ts-ignore
const Context = createContext<SupabaseContext>()

export default function SupabaseProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: MaybeSession
}) {
  const [supabase] = useState(() => createBrowserClient())

  return (
    <Context.Provider value={{ supabase, session }}>
      <>{children}</>
    </Context.Provider>
  )
}

export const useSupabase = () => useContext(Context)
