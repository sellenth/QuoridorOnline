'use client'
import React from 'react'
import { useSupabase } from '../../components/supabase-provider'
import { v4 as uuidv4 } from 'uuid';

type props = {initiator_id: string, opponent_id: string}

export default function AcceptRejectInvite( { initiator_id, opponent_id }: props) {
    const { supabase, session } = useSupabase()

    const accept = async () => {
        console.log('accepting')
        let gid = uuidv4();
        // create a game in the games table with this gid
        let res2 = await supabase.from('games')
                                 .insert({id: gid, move_num: 0, p1_id: initiator_id, p2_id: opponent_id})
        // add gid to this game-invite
        let res1 = await supabase.from('game-invites')
                                 .update({gid: gid})
                                 .match({ 'initiator_id': initiator_id, 'opponent_id': opponent_id })

        console.log(res1)
        console.log(res2)
    }

    const decline = async () => {
        console.log('declining game invite',)
        let res = await supabase.from('game-invites').delete().match({ 'initiator_id': initiator_id, 'opponent_id': opponent_id })
        console.log(res)
    }

    return (
        <>
            <button className="border-2 rounded-md border-theme-500 px-2 mx-2 h-8 shadow-lg hover:bg-theme-500 hover:shadow-theme-500/50 " onClick={accept}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
            </button>
            <button className="border-2 rounded-md border-theme-red px-2 h-8     shadow-lg hover:bg-theme-red hover:shadow-theme-red/50 " onClick={decline}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </>
    )
}