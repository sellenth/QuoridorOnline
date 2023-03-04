'use client'

import Login from './login'
import Link from 'next/link'
import { useSupabase } from './supabase-provider'

function HeaderButton( { link, text, color }: {link: string, text: string, color: string | undefined}) {
  return (
    <Link className={`font-display text-center hover:text-theme-100 ${ color ? color : "text-gray-200"} text-xl font-bold py-4 px-12 hover:border-b-2 border-b-[1px] pb-[20px] hover:pb-[19px] font-sans`} href={link}>
    {text}
    </Link>
  )
}

export default function Header() {
  const { supabase, session } = useSupabase()

  let username = session?.user.user_metadata.preferred_username ?? null

  return (
    <div className=" z-10 w-full flex items-center justify-center justify-items-center grid-cols-5">
      <HeaderButton link="/" text="HOME"/>
      <HeaderButton link="/scoreboard" text="SCOREBOARD" />
      <HeaderButton link="/friendslist" text="FRIENDS" />
      <HeaderButton link="/game-invites" text="GAMES" />
      <HeaderButton link="/signup" text={`${username == null ? "LOGIN" : username}`} color="text-theme-500" />
    </div>
  )
}
