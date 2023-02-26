'use client'
import React from 'react'
import { useSupabase } from '../../components/supabase-provider'

type props = {requester_id: string, my_id: string}

export default function AcceptRejectInvite( { my_id, requester_id }: props) {
    const { supabase, session } = useSupabase()

    const accept = async () => {
        console.log('accepting', requester_id)
        let res1 = await supabase.from('friends').update({accepted: true}).match({ 'user_id': requester_id, 'friend_id': my_id })
        let res2 = await supabase.from('friends').insert({ 'user_id': my_id, 'friend_id': requester_id, 'accepted': true})

        console.log(res1)
        console.log(res2)
    }

    const decline = async () => {
        console.log('declining', requester_id)
        let res = await supabase.from('friends').delete().match({ 'user_id': requester_id, 'friend_id': my_id })
        console.log(res)
    }

    return (
        <>
            <button className="border-2 rounded-md border-red-500 py-1 px-2" onClick={accept}>ok</button>
            <button className="border-2 rounded-md border-red-500 py-1 px-2" onClick={decline}>no</button>
        </>
    )
}