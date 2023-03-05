'use client'
import Link from "next/link"
import { useRef } from "react"

export default function SignIn() {
    const { supabase, session } = useSupabase()
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)


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

    return (<div className="text-gray-200">
      <div className="max-w-sm align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
        <h1 className="font-display">LOG IN</h1>
        <input className="w-full block bg-transparent border-b-2 outline-none" type="text" placeholder="email" ref={emailRef}/>
        <input className="w-full block bg-transparent border-b-2 outline-none" type="text" placeholder="password" ref={passwordRef}/>
        <button onClick={handleEmailLogin} className="font-display w-full mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
            >Submit</button>
        <p>Don't have an account? <span>
            <Link className="underline" href="singup">
                Sign Up
            </Link>
        </span>
        </p>
        </div>
    </div>)
}