'use client'

import Login from './login'
import Link from 'next/link'
import { useSupabase } from './supabase-provider'

export default function Header() {
  const { supabase, session } = useSupabase()

  let username = session?.user.user_metadata.preferred_username ?? null

  return (
    <div className="bg-theme-100 flex items-center w-full">
      <Link href="/">
        <button className="text-theme-300 flex-none  text-3xl font-bold mx-3 my-1">
          QO
        </button>
      </Link>
      <div className="text-black flex-initial mr-2 ml-auto">
        {session ? `Hello, ${username ?? 'nice'}` : `Not signed in`}
      </div>
      <div className="flex-initial mr-2">
        <Login />
      </div>
    </div>
  )
}
