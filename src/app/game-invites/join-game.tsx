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
            <button className="border-2 rounded-md border-red-500 py-1 px-2" onClick={accept}>join game</button>
    )
}