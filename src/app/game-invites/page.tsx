'use client'

import CreateInvite from './create-invite'
import { useSupabase } from '../../components/supabase-provider'
import AcceptRejectInvite from './accept-reject-invite'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import JoinGame from './join-game'
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/utils/db-types'
import { mockIncomingGameInvite, mockInProgressGameInvite, mockMyId, mockMyUsername, mockSentGameInvite } from '@/utils/mock-data'
import { GameInvite } from '@/utils/query-types'
import AddRightBorder from '@/components/right-border'
import { DecorativeCircles } from '@/components/decordatives'


const subscribeToDbChanges = (supabase: SupabaseClient<Database>, id_to_listen_on: string, callback: () => any) => {
    const channel = supabase
        .channel('game-invites-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game-invites',
                filter: `initiator_id=eq.${id_to_listen_on}`
            },
            () => { callback() }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game-invites',
                filter: `opponent_id=eq.${id_to_listen_on}`
            },
            () => { callback() }
        )
        .subscribe((status: any) => {
            console.log('game-invites table status:', status)
        })
    return channel
}


export default function FriendsList() {
    let searchParams = useSearchParams()
    let username = searchParams.get('username') ?? ''
    const { supabase, session } = useSupabase()

    const my_id = session?.user!.id || ''

    const [sent, setSent] = useState<GameInvite[]>([])
    const [received, setReceived] = useState<GameInvite[]>([])
    const [inProgress, setInProgress] = useState<GameInvite[]>([])


    useEffect(() => {
        const updateTableFromDB = async () => {
            const { data, error } = await supabase
                .from('game-invites')
                .select('initiator:initiator_id(username, id), opponent:opponent_id(username, id), gid, rows, cols, layers')
                .or(`initiator_id.eq.${my_id},opponent_id.eq.${my_id}`)

            if (data) {
                let game_invites = data as GameInvite[]
                setSent(game_invites.filter((invite) => { return invite.initiator.id == my_id && invite.gid == null }))
                setReceived(game_invites.filter((invite) => { return invite.opponent.id == my_id && invite.gid == null }))
                setInProgress(game_invites.filter((invite) => { return invite.gid != null }))
            }
        }

        let channel: null | RealtimeChannel = null
        if (process.env.NEXT_PUBLIC_TESTING) {
            setSent(mockSentGameInvite)
            setReceived(mockIncomingGameInvite)
            setInProgress(mockInProgressGameInvite)
        } else {
            channel = subscribeToDbChanges(supabase, my_id, updateTableFromDB)
            updateTableFromDB()
        }

        return () => {
            if (channel)          supabase.removeChannel(channel)
        }
    }, [supabase, my_id])

    return (
        <div className="text-gray-200 mx-auto px-2 pb-2 md:px-10 w-full sm:w-fit">
            <div className="w-fit align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
                <CreateInvite my_id={my_id} username={username} />
            </div>

            <AddRightBorder>
                <div className="bg-blue-200 bg-opacity-10 backdrop-blur p-4">
                    <table>
                        <thead>
                            <tr>
                                <th className="font-display">GAME INVITES SENT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sent &&
                                sent.map((game) => (
                                    <tr key={game.opponent.id}>
                                        <td>{game.opponent.username}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </AddRightBorder>

            <DecorativeCircles />

            <div className="flex flex-col sm:flex-none sm:grid sm:grid-cols-2 gap-2">
                <div className="bg-blue-200 bg-opacity-10 backdrop-blur border-2 border-gray-200 p-2 rounded-md sm:rounded-r-none">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="text-start font-display">GAME INVITES RECEIVED</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {received &&
                                received.map((game) => (
                                    <tr key={game.initiator.id} className="flex h-9">
                                        <td className="flex-1 truncate">
                                            {game.initiator.username}
                                        </td>
                                        <td className="flex-none text-end">
                                            <AcceptRejectInvite initiator_id={game.initiator.id}
                                                opponent_id={game.opponent.id}
                                                rows={game.rows}
                                                cols={game.cols}
                                                layers={game.layers}
                                                start_fences={game.start_fences}
                                            />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-blue-200 bg-opacity-10 backdrop-blur border-2 border-gray-200 p-2 rounded-md sm:rounded-l-none">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="text-start font-display">ACTIVE GAMES</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {inProgress &&
                                inProgress.map((game: any) => {
                                    let their_id = game.initiator.id == my_id ? game.opponent.id : game.initiator.id
                                    let their_name = game.initiator.id == my_id ? game.opponent.username : game.initiator.username

                                    return (
                                        <tr key={their_id} className="flex h-9">
                                            <td className="flex-1 truncate">
                                                {their_name}
                                            </td>
                                            <td className="flex-none text-end">
                                                <JoinGame gid={game.gid} />
                                            </td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}