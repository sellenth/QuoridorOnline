'use client'
import { useSupabase } from '../../components/supabase-provider'
import { useRef } from 'react'

type props = {
    username: string
    my_id: string
}

export default function CreateInvite( { username, my_id }: props) {
    const { supabase, session } = useSupabase()
    const friendRef = useRef<HTMLInputElement>(null)
    const rowRef   = useRef<HTMLInputElement>(null)
    const colRef   = useRef<HTMLInputElement>(null)
    const layerRef = useRef<HTMLInputElement>(null)

    if (session && session.user.id) {
        const sendInvite = () => {
            async function createInviteUsingUsername( username: string ) {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)

                console.log(data, error)

            // we have their id, create a game invite
            if (data && data.length > 0) {
                let rows = rowRef.current?.value ?? 9
                let cols = rowRef.current?.value ?? 9
                let layers = rowRef.current?.value ?? 3
                const { error } = await supabase
                    .from('game-invites')
                    .insert({ initiator_id: my_id, opponent_id: data[0].id, rows: rows, cols: cols, layers: layers })

                if (error) {
                    console.log(error)
                }

            }
            }

            createInviteUsingUsername(friendRef.current!.value)

        }

        return (
            <>
                <h3>Invite to game by username</h3>
                <input type="text" ref={friendRef} placeholder="username" defaultValue={username} />
                <button onClick={sendInvite}>invite</button>
                <div className="grid grid-cols-3">
                    <div>
                        <h3>Board rows</h3>
                        <input type="text" ref={rowRef} defaultValue={9} />
                    </div>
                    <div>
                        <h3>Board cols</h3>
                        <input type="text" ref={colRef} defaultValue={9} />
                    </div>
                    <div>
                        <h3>Board layers</h3>
                        <input type="text" ref={layerRef} defaultValue={3} />
                    </div>
                </div>
            </>
        )
    }
    else {
        // middleware should make this path impossible
        return <h1>Halt right there criminal scum!</h1>
    }

}