'use client'

import { useSupabase } from './supabase-provider'
import { useEffect, useRef } from 'react'

// Supabase auth needs to be triggered client-side
export default function Login() {
  const { supabase, session } = useSupabase()
  const emailRef = useRef(null)
  const pwRef = useRef(null)

  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailRef.current.value,
      password: 'password' //pwRef.current.value
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
    } else { console.log(data) }
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
      <input ref={emailRef} />
      <input ref={pwRef} />
      <button onClick={handleEmailSignUp}>Email Signup</button>
      <br />
      <button onClick={handleEmailLogin}>Email Login</button>
      <br />
      <button onClick={handleGitHubLogin}>GitHub Login</button>
    </>
  )
}
