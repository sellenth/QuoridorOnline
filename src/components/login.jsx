'use client'

import { useSupabase } from './supabase-provider'

// Supabase auth needs to be triggered client-side
export default function Login() {
  const { supabase, session } = useSupabase()

  const handleEmailSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'halston@sellent.in',
      password: 'password',
      options: {
        data: {
          preferred_username: 'gamer'
        }
      },
    })

    if (error) {
      console.log({ error })
    }
  }

  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'halston@sellent.in',
      password: 'password',
    })

    if (error) {
      console.log({ error })
    }
  }

  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })

    if (error) {
      console.log({ error })
    } else { console.log( data ) }
  }

  const handleGitHubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })

    if (error) {
      console.log({ error })
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.log({ error })
    }
  }

  // this `session` is from the root loader - server-side
  // therefore, it can safely be used to conditionally render
  // SSR pages without issues with hydration
  return session ? (
    <button onClick={handleLogout}>Logout</button>
  ) : (
    <>
      <button onClick={handleEmailSignUp}>Email Signup</button>
      <br />
      <button onClick={handleEmailLogin}>Email Login</button>
      <br />
      <button onClick={handleGitHubLogin}>GitHub Login</button>
    </>
  )
}
