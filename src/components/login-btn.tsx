import Link from 'next/link'
import { useUser } from '@supabase/auth-helpers-react'
import { supabase } from '../lib/supabaseClient'

export default function Component() {
  const user = useUser()
  if (user) {
    return <button onClick={() => signOut()}>Sign out</button>
  }
  return <button onClick={() => signInWithGitHub()}>Sign in</button>
}
const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000/'
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Make sure to including trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  return url
}

async function signInWithGitHub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: getURL(),
    },
  })
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
}
