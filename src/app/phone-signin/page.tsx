'use client'
import { useSupabase } from "@/components/supabase-provider"
import { FormEvent, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AnimatedCandy } from "@/components/decordatives"
import { toast } from 'react-tiny-toast';

export default function PhoneSignUpIn() {
    const { supabase, session } = useSupabase()
    const router = useRouter()
    const usernameRef = useRef<HTMLInputElement>(null)
    const phoneRef = useRef<HTMLInputElement>(null)
    const OTPRef = useRef<HTMLInputElement>(null)
    const [ phoneNum, setPhoneNum ] = useState('');
    const [ showOTP, setShowOTP ] = useState(false);

    const handlePhoneSignup = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (phoneRef.current &&  usernameRef.current) {
            setPhoneNum(phoneRef.current.value.replace(' ', ''))

            console.log(phoneNum)
            console.log(usernameRef.current.value)
            const { data, error } = await supabase.auth.signInWithOtp({
                phone: phoneNum,
                options: {
                    data: {
                        preferred_username: usernameRef.current.value
                    }
                },
            })

            if (error) {
                let msg = error.message;
                toast.show(msg, { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
                console.log(error)
            } else {
                setShowOTP(true);
            }
        }
    }

    const handleOTPInput = ( { target: { value: v } }: React.ChangeEvent<HTMLInputElement> ) => {
        if (v.length == 6) {
           submitOTP(v);
        }

        if (v.length > 6 && OTPRef.current) {
            OTPRef.current.value = v.slice(0, 6);
        }
    }


    const submitOTP = async (v: string) => {
        let { data, error } = await supabase.auth.verifyOtp({
            phone: phoneNum,
            token: v,
            type: 'sms',
        })
        if (error) {
            let msg = error.message;
            toast.show(msg, { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
            console.log(error)
        } else {
            router.push('/')
        }
    }



    return (<div className="text-gray-200">
        <div className="max-w-fit align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <AnimatedCandy />
            <h1 className="font-display w-max font-bold">USE MOBILE</h1>
            <h1 className="font-display w-max"></h1>
            {showOTP ?
                <form >
                    <label>Great, now enter the code we sent you.</label>
                    <input autoFocus required
                        className="w-full block bg-transparent border-b-2 outline-none"
                        type="number"
                        placeholder="123456"
                        maxLength={6}
                        ref={OTPRef}
                        onChange={handleOTPInput}
                    />
                </form>
                :
                <form onSubmit={handlePhoneSignup}>
                    <input autoFocus required
                        className="w-full block bg-transparent border-b-2 outline-none"
                        type="text" minLength={3} maxLength={18}
                        placeholder="username" ref={usernameRef} />
                    <div className="flex w-full">
                        <label>+1</label>
                        <input required className="w-full block bg-transparent border-b-2 outline-none inline" type="tel" minLength={10} maxLength={10} placeholder="5554443210" ref={phoneRef} />
                    </div>
                    <></>
                    <button type="submit" className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                    >Send me a code</button>
                </form>
            }
            <AnimatedCandy />
        </div>
    </div>)
}