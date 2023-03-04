'use client'
import React from 'react'
import Link from 'next/link'

type props = {friend_username: string}

export default function InviteToGame( { friend_username }: props) {
    return (
        <Link passHref href={{
            pathname: '/game-invites',
            query: { username: friend_username }
        }}
            className="font-display shadow-lg hover:bg-theme-500 hover:shadow-theme-500/50 border-2 rounded-md border-theme-500 py-1 px-2"
        >
            challenge
        </Link>
    )
}