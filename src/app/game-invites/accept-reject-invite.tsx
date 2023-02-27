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
            <button className="border-2 rounded-md border-red-500 py-1 px-2" onClick={accept}>ok</button>
            <button className="border-2 rounded-md border-red-500 py-1 px-2" onClick={decline}>no</button>
        </>
    )
}