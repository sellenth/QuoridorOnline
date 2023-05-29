'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useSupabase } from './supabase-provider'
import { ToastContainer } from 'react-tiny-toast';


function HeaderButton({ link, text, color, authed = true, className = '', prefetch=false }: { link: string, text: string, color?: string, authed?: boolean, className?: string, prefetch?: boolean }) {
  let url = authed ? link : '/signin'
    return (
      <Link prefetch={prefetch}
            className={`${className} btn-transition hover:bg-thm-500 font-display text-center hover:text-theme-100
                        ${color ? color : "text-gray-200"} text-sm md:text-base font-bold pt-4 px-1
                        md:px-8 lg:px-12 hover:border-b-2 border-b-[1px] pb-[5px] md:pb-[20px] hover:pb-[4px] md:hover:pb-[19px]`} as={link} href={url}>
            {text}
        </Link>
    )
}

export default function Header() {
  const { session } = useSupabase()

  let username = session?.user.user_metadata.preferred_username ?? null
  let isAuthed = !! (session?.user)

  useEffect( () => {
      if (navigator.userAgent.indexOf('iPhone') > -1) {
          document
              .querySelector("[name=viewport]")!
              .setAttribute("content", "width=device-width, initial-scale=1, maximum-scale=1");
      }
  } )


  return (
    <div className="z-10 w-full flex items-center justify-center justify-items-center grid-cols-5">
      <HeaderButton className="hidden sm:block" link="/" text="HOME" prefetch={true} />
      <HeaderButton link="/scoreboard" text="SCOREBOARD" prefetch={true} />
      <HeaderButton link="/friendslist" text="FRIENDS" authed={isAuthed} />
      <HeaderButton link="/game-invites" text="GAMES" authed={isAuthed} />
      <HeaderButton link="/account" text={username ? "ACCOUNT" : "LOGIN"} color="text-theme-500" authed={isAuthed} />
      < ToastContainer />
    </div>
  )
}
