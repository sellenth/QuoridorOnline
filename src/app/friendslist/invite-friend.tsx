'use client'
import { useSupabase } from '../../components/supabase-provider'
import { useRef } from 'react'

export default function InviteFriend() {
    const { supabase, session } = useSupabase()
    const friendRef = useRef<HTMLInputElement>(null)

    if (session && session.user.id) {
        const sendInvite = () => {
            async function getIdFromUsername( username: string ) {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)

                console.log(data, error)
            if (data && data.length > 0) {
                console.log('here')
                const { error } = await supabase
                    .from('friends')
                    .insert({ user_id: session!.user.id, friend_id: data[0].id })

                if (error) {
                    console.log(error)
                }

            }
            }

            getIdFromUsername(friendRef.current!.value)

        }

        return (
            <>
                <h3>Invite a friend by username</h3>
                <input type="text" ref={friendRef} placeholder="username" />
                <button onClick={sendInvite}>invite</button>
            </>
        )
    }
    else {
        // middleware should make this path impossible
        return <h1>Halt right there criminal scum!</h1>
    }

}