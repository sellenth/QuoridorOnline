'use client'

import Login from './login'
import Link from 'next/link'
import { useSupabase } from './supabase-provider'

function HeaderButton( { link, text }: {link: string, text: string, selected: boolean}) {
  return (
    <Link className='font-sans' href={link}>
      <button className='hover:text-theme-100 text-xl font-bold w-full mx-12 my-4 hover:border-b-2 border-b-[1px] pb-[20px] hover:pb-[19px]'>
    {text}
    </button>
  </Link>
  )
}

export default function Header() {
  const { supabase, session } = useSupabase()

  let username = session?.user.user_metadata.preferred_username ?? null

  return (
    <div className="box-border flex items-center justify-center items-center text-gray-200 py-6">
      <HeaderButton link="/" text="HOME"/>
      <HeaderButton link="/scoreboard" text="SCOREBOARD" />
      <HeaderButton link="/friendslist" text="FRIENDS" />
      <HeaderButton link="/game-invites" text="GAMES" />
      <div className={`${ username ? 'text-theme-500' : 'text-theme-red'} ml-20 mr-2`}>
        {session ? `Logged in as ${username ?? 'cadet'}` : `Not signed in`}
      </div>
    </div>
  )
}
