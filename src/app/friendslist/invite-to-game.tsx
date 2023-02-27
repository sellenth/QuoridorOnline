'use client'
import React from 'react'
import Link from 'next/link'

type props = {friend_username: string}

export default function InviteToGame( { friend_username }: props) {
    return (
        <Link passHref href={{
            pathname: '/game-invites',
            query: { username: friend_username}
        }}>
            <button className="border-2 rounded-md border-red-500 py-1 px-2">invite to game</button>
        </Link>
    )
}