import { createMiddlewareSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// this middleware refreshes the user's session and must be run
// for any Server Component route that uses `createServerComponentSupabaseClient`
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createMiddlewareSupabaseClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log(req.nextUrl.pathname)

  if (!process.env.NEXT_PUBLIC_TESTING && !session && (
          req.nextUrl.pathname.startsWith('/friendslist')
      ||  req.nextUrl.pathname.startsWith('/account')
      ||  req.nextUrl.pathname.startsWith('/game-invites')
  )) {
    // Auth condition not met, redirect to home page.
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/signin'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname + '?' + req.nextUrl.searchParams)

    return NextResponse.redirect(redirectUrl)
  }

  return res
}
