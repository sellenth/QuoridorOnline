'use client'
import React from 'react'
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation';

type props = { gid: string }

export default function JoinGame({ gid }: props) {
    const router = useRouter()

    const accept = async () => {
        console.log('joining game', gid)
        setCookie('current_gid', gid)
        router.push('/game')
    }

    return (
        <button
            className="font-display shadow-lg hover:bg-theme-500 h-8 hover:shadow-theme-500/50 border-2 rounded-md border-theme-500 py-1 px-2"
            onClick={accept}>
            join game
        </button>
    )
}