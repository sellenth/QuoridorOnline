'use client'

import { useSupabase } from "@/components/supabase-provider"
import Link from "next/link"
import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from 'next/navigation';
import { AnimatedCandy, SlashCandy } from "@/components/decordatives";

export default function SignIn() {
    const { supabase, session } = useSupabase()
    const router = useRouter()
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

    const handleEmailLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (emailRef.current && passwordRef.current) {
            const { error } = await supabase.auth.signInWithPassword({
                email: emailRef.current.value,
                password: passwordRef.current.value
            })

            if (error) {
                console.log({ error })
            } else {
                const queryString = window.location.search
                const urlParams = new URLSearchParams(queryString)
                const redirectUrl = urlParams.get('redirectedFrom')
                if (redirectUrl) {
                   router.push(redirectUrl)
                } else {
                    router.push('/')
                }
            }
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

    return (<div className="text-gray-200">
        <div className="max-w-fit align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <AnimatedCandy />
            <h1 className="font-display w-max font-bold">LOG IN</h1>
            <form onSubmit={handleEmailLogin}>
                <input autoFocus required className="w-full inline block bg-transparent border-b-2 outline-none" type="text" placeholder="email" ref={emailRef} />
                <input required className="w-full block bg-transparent border-b-2 outline-none" type="password" placeholder="password" ref={passwordRef} />
                <button type="submit" className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                >Submit</button>
            </form>

            <p className="text-center">Don&apos;t have an account? <span>
                <Link className="underline" href="signup">
                    Sign Up
                </Link>
            </span>
            </p>
            <p className="my-4 text-center">--- OR ---</p>
            <div className="inline-flex items-center justify-center w-full gap-x-2">
                <button onClick={handleGitHubLogin} className="font-display mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-md border-theme-200 py-1 px-2"
                >
                    Use Github
                </button>
            </div>
            <AnimatedCandy />
        </div>
    </div>)
}