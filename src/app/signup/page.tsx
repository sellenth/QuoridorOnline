'use client'
import { useSupabase } from "@/components/supabase-provider"
import { FormEvent, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatedCandy } from "@/components/decordatives"
import { toast } from 'react-tiny-toast';

export default function SignUn() {
    const { supabase, session } = useSupabase()
    const router = useRouter()
    const usernameRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)

    const handleEmailSignUp = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

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
                let msg = error.message;
                if (error.status == 500) {
                    msg = "That username is already in use"
                } else if (error.status == 400){
                    msg = "That email is already in use"
                }
                toast.show(msg, { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" } )
                console.log({ error })
            } else {
                toast.show("Please check your email to complete sign up", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-200 border border-gray-200" } )
            }

        }
    }



    return (<div className="text-gray-200">
        <div className="max-w-fit align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <AnimatedCandy />
            <h1 className="font-display w-max font-bold">SIGN UP</h1>
            <h1 className="font-display w-max"></h1>
            <form onSubmit={handleEmailSignUp}>
                <input autoFocus required className="w-full block bg-transparent border-b-2 outline-none" type="text" maxLength={18} placeholder="username" ref={usernameRef} />
                <input required className="w-full block bg-transparent border-b-2 outline-none" type="text" placeholder="email" ref={emailRef} />
                <input required className="w-full block bg-transparent border-b-2 outline-none" type="password" placeholder="password" ref={passwordRef} />
                <></>
                <button type="submit" className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                >Submit</button>
            </form>
            <p>Already have an account?
                <span>
                    <Link className="ml-1 underline" href="signin">
                        Sign In
                    </Link>
                </span>
            </p>
            <AnimatedCandy />
        </div>
    </div>)
}