'use client'

import { useSupabase } from "@/components/supabase-provider"
import Link from "next/link"
import { useRef } from "react"

export default function SignIn() {
    const { supabase, session } = useSupabase()
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)


    const handleGitHubLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        })

        if (error) {
        console.log({ error })
        }
    }

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
        <input className="w-full block bg-transparent border-b-2 outline-none" type="password" placeholder="password" ref={passwordRef}/>
        <button onClick={handleEmailLogin} className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
            >Submit</button>
        <p>Don't have an account? <span>
            <Link className="underline" href="signup">
                Sign Up
            </Link>
        </span>
        </p>
        <div className="inline-flex items-center justify-center w-full">
            <hr className="w-64 h-px my-8 bg-gray-200 border-0" />
            <span className="absolute px-3 font-medium text-gray-200 -translate-x-1/2 bg-[#192331] left-1/2">OR</span>
        </div>
        <div className="inline-flex items-center justify-center w-full gap-x-2">
            <button onClick={handleGitHubLogin} className="font-display mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-md border-theme-200 py-1 px-2"
            >
                Use Github
        </button>
        </div>
        </div>
    </div>)
}