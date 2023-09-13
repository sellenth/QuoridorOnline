'use client'
import React from 'react'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation';
import { toast } from 'react-tiny-toast';

type props = { 
    gid: string
    firstId: string,
    secondId: string
 }

export default function JoinGame({ gid, firstId, secondId }: props) {
    const router = useRouter()

    const accept = async () => {
        console.log('joining game', gid)
        setCookie('current_gid', gid)
        router.push('/game')
    }

    const copy = async () => {
        let link = `${window.location.origin}/game-invites?firstId=${firstId}&secondId=${secondId}`
        console.log(link)
        navigator.clipboard.writeText(link)
        toast.show("Game invite copied.", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-200 border border-gray-200" })
    }

    return (
        <div className="w-fit">
            <button
                className="font-display shadow-lg hover:bg-theme-500 h-8 hover:shadow-theme-500/50 border-2 rounded-md border-theme-500 py-0 inline-block px-1"
                onClick={accept}>
                join game
            </button>
            <button
                className="font-display shadow-lg hover:bg-theme-200 h-8 hover:shadow-theme-200/50 border-2 rounded-md border-theme-200 ml-1 px-2 py-2 w-fit"
                onClick={copy}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
            </button>
        </div>
    )
}