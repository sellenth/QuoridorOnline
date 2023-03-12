'use client'
import { useSupabase } from "@/components/supabase-provider"
import { useRef } from "react"
import Link from "next/link"

export default function SignUn() {
    const { supabase, session } = useSupabase()
    const usernameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    const handleEmailSignUp = async () => {

        if (emailRef.current && passwordRef.current && usernameRef.current) {
            const { data, error } = await supabase.auth.signUp({
                email: emailRef.current.value,
                password: passwordRef.current.value,
                options: {
                    data: {
                        preferred_username: usernameRef.current.value
                    }
                },
            })

            if (error) {
                console.log({ error })
            }

        }
    }



    return (<div className="text-gray-200">
        <div className="max-w-sm align-center mx-auto my-10 bg-[#192331] p-4 border-2 border-gray-200 rounded-md">
            <h1 className="font-display">SIGN UP</h1>
            <input className="w-full block bg-transparent border-b-2 outline-none" type="text" maxLength={18} placeholder="username" ref={usernameRef} />
            <input className="w-full block bg-transparent border-b-2 outline-none" type="text" placeholder="email" ref={emailRef} />
            <input className="w-full block bg-transparent border-b-2 outline-none" type="password" placeholder="password" ref={passwordRef} />
            <button onClick={handleEmailSignUp} className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
            >Submit</button>
            <p>Already have an account? <span>
                <Link className="underline" href="signin">
                    Sign In
                </Link>
            </span>
            </p>
        </div>
    </div>)
}