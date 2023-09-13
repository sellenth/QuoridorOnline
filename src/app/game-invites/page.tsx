'use client'

import CreateInvite from './create-invite'
import { useSupabase } from '../../components/supabase-provider'
import AcceptRejectInvite from './accept-reject-invite'
import { useEffect, useState } from 'react'
import { setCookie } from 'cookies-next'
import { useSearchParams, useRouter } from 'next/navigation'
import JoinGame from './join-game'
import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/utils/db-types'
import { mockIncomingGameInvite, mockInProgressGameInvite, mockMyId, mockMyUsername, mockSentGameInvite } from '@/utils/mock-data'
import { GameInvite } from '@/utils/query-types'
import AddRightBorder from '@/components/right-border'
import { DecorativeCircles } from '@/components/decordatives'
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-tiny-toast';


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
    let firstId = searchParams.get('firstId') ?? ''
    let secondId = searchParams.get('secondId') ?? ''
    const { supabase, session } = useSupabase()
    const router = useRouter()

    const my_id = session?.user!.id || ''

    const [sent, setSent] = useState<GameInvite[]>([])
    const [received, setReceived] = useState<GameInvite[]>([])
    const [inProgress, setInProgress] = useState<GameInvite[]>([])
    const [URLmatchedInvite, setURLmatchedInvite] = useState<GameInvite | undefined>(undefined);

    const accept = async (initiator_id: string, opponent_id: string,
                          p1_time: string, p2_time: string,
                          rows: number, cols: number, layers: number,
                          start_fences: number) => {
        console.log('accepting')
        let gid = uuidv4();

        let { data, error } = await supabase.from('game-invites')
                                 .select('*')
                                 .match({ 'initiator_id': initiator_id, 'opponent_id': opponent_id })
        if (data && data[0].gid == null ) {
                console.log(data)
                // create a game in the games table with this gid
                let res2 = await supabase.from('games')
                                        .insert({id: gid, move_num: 0, p1_id: initiator_id, p2_id: opponent_id,
                                                rows, cols, layers, p1_time, p2_time, start_fences})
                // add gid to this game-invite
                let res1 = await supabase.from('game-invites')
                                        .update({gid: gid})
                                        .match({ 'initiator_id': initiator_id, 'opponent_id': opponent_id })


                console.log(res1)
                console.log(res2)

                setCookie('current_gid', gid);
                router.push('/game');
        } else {
            console.log(error)
            toast.show("Couldn't accept invite", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
        }
    }

    useEffect(() => {
        const fn = async () => {
            const el = URLmatchedInvite;
            setURLmatchedInvite(undefined);
            if (el != undefined) {
                if (el.gid == null) {
                    await accept(el.initiator.id, el.opponent.id, el.p1_time, el.p2_time, el.rows, el.cols, el.layers, el.start_fences);
                } else {
                    setCookie('current_gid', el.gid);
                    router.push('/game');
                }
            }
        }
        fn();
    }, [URLmatchedInvite])

    useEffect(() => {
        const updateTableFromDB = async () => {
            const { data, error } = await supabase
                .from('game-invites')
                .select('initiator:initiator_id(username, id), opponent:opponent_id(username, id), gid, rows, cols, layers, game:gid(winner), p1_time, p2_time')
                .or(`initiator_id.eq.${my_id},opponent_id.eq.${my_id}`)

            if (data) {
                let game_invites = data as GameInvite[]
                setSent(game_invites.filter((invite) => { return invite.initiator.id == my_id && invite.gid == null }))
                setReceived(game_invites.filter((invite) => { return invite.opponent.id == my_id && invite.gid == null }))
                setInProgress(game_invites.filter((invite) => { return invite.gid && !invite.game.winner }))

                console.log(game_invites)
                let match = game_invites.find((el) => { return el.initiator.id == firstId && el.opponent.id == secondId })

                console.log(match)
                if (match) {
                    // maybe this can be cleaned up, do I really need this extra state var?
                    setURLmatchedInvite(match);
                }
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
            if (channel) supabase.removeChannel(channel)
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
                                            <AcceptRejectInvite
                                                acceptFn={accept}
                                                initiator_id={game.initiator.id}
                                                opponent_id={game.opponent.id}
                                                rows={game.rows}
                                                cols={game.cols}
                                                layers={game.layers}
                                                p1_time={game.p1_time}
                                                p2_time={game.p2_time}
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
                                        <tr key={game.gid} className="h-9">
                                            <td className="truncate w-fit inline-block">
                                                {their_name}
                                            </td>
                                            <td className="ml-auto text-end">
                                                <JoinGame gid={game.gid} firstId={game.initiator.id} secondId={game.opponent.id} />
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