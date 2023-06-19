'use client'
import { useSupabase } from '../../components/supabase-provider'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-tiny-toast';
import { v4 as uuidv4 } from 'uuid';
import { setCookie } from 'cookies-next'
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';

// access an internal function, hope they don't change that :)
type HackedChannel = RealtimeChannel & { _isJoined: () => boolean}

type props = {
    username: string
    my_id: string
}
type PresenceState = {presence_ref: string, online_at: number}

export default function CreateInvite( { username, my_id }: props) {
    const router = useRouter()
    const { supabase, session } = useSupabase()
    const friendRef = useRef<HTMLInputElement>(null)
    const [rows, setRows] = useState(9)
    const [cols, setCols] = useState(9)
    const [layers, setLayers] = useState(2)
    const [start_fences, setStartFences] = useState(10)
    const [quickplayChannel, setQuickplayChannel] = useState<HackedChannel | null>(null);
    const [numOnline, setNumOnline] = useState(0);
    const [queueing, setQueueing] = useState(false);

    const joinQuickmatch = () => {
        if (!quickplayChannel || quickplayChannel._isJoined()) return;

        quickplayChannel
            .on('broadcast', { event: 'quickplay' }, (p: any) => {
                let [id, gid] = p.payload;
                console.log(my_id, id)
                if (my_id == id) {
                    setCookie('current_gid', gid);
                    router.push('/game')
                }
            })
            .on('presence', { event: 'sync' }, async () => {
                const state = quickplayChannel.presenceState();
                let minTime = new Date().getTime();
                let minUid = null;

                setNumOnline(Object.keys(state).length);


                if ( () => queueing ) {
                    for (const [uid, value] of Object.entries(state)) {
                        let timestamp = (value as PresenceState[])[0].online_at;
                        if (timestamp < minTime) {
                            minTime = timestamp;
                            minUid = uid;
                        }
                    }

                    if (minUid == my_id) {
                        const others = Object.keys(state);
                        if (others.length > 1) {
                            console.log('im the oldest, creating invite for one other connected client')
                        }
                        for (let i = 0; i < others.length; ++i) {
                            const their_id = others[i];
                            if (their_id != my_id) {
                                //invite this user
                                let gid = uuidv4();


                                // create a game in the games table with this gid
                                let res1 = await supabase.from('games')
                                    .insert({ id: gid, move_num: 0, p1_id: my_id, p2_id: their_id, rows, cols, layers, start_fences })

                                if (res1.error) continue;

                                const res2 = await supabase
                                    .from('game-invites')
                                    .insert({ gid: gid, initiator_id: my_id, opponent_id: their_id, rows, cols, layers, start_fences })

                                console.log(res1)
                                console.log(res2)

                                // two users are trying to match eachother when they already have an active game
                                if (res2.error) {
                                    const res3 = await supabase
                                        .from('games')
                                        .delete()
                                        .eq('id', gid )
                                    console.log(res3.error)
                                    continue;
                                }

                                quickplayChannel.send({
                                    type: 'broadcast',
                                    event: 'quickplay',
                                    payload: [
                                        their_id,
                                        gid
                                    ]
                                })

                                setCookie('current_gid', gid)
                                router.push('/game')


                                break;
                            }
                        }
                    }
                }
            }).subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('quickmatch realtime status:', status)
                }
            });
    }

    useEffect( () => {
        const c = supabase.channel('quickplay', { config: { presence: { key: my_id }, }, }) as HackedChannel;
        setQuickplayChannel(c);

        return () => {
            console.log('unsubbing from quickplay')
            supabase.removeChannel(c);
        }
    }, [] );

    useEffect( () => {
        if (quickplayChannel && !quickplayChannel._isJoined()) {
            try {
                joinQuickmatch();

            } catch (e) {
                console.error(e);
            }
        }
    }, [quickplayChannel]);

    useEffect( () => {
        if (quickplayChannel) {
            if (queueing) {
                quickplayChannel.track({
                    online_at: new Date().getTime(),
                })
            } else {
                quickplayChannel.untrack();
            }
        }
    }, [queueing]);

    const toggleQueueing = async () => {
        setQueueing(!queueing);
    }


    if (process.env.NEXT_PUBLIC_TESTING || (session && session.user.id)) {
        const sendInvite = () => {
            async function createInviteUsingUsername( username: string ) {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)

                if (!data) return;

                if (data.length == 0 || error) {
                    toast.show("That user could not be found", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
                } else {
                    // we have their id, create a game invite
                    if (data && data.length > 0) {
                        const { error } = await supabase
                            .from('game-invites')
                            .insert({ initiator_id: my_id, opponent_id: data[0].id, rows, cols, layers, start_fences })

                        if (error) {
                            console.log(error)
                            toast.show("Error creating an invite, are you already in a match with this player?", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
                        }

                    }
                }
            }

            createInviteUsingUsername(friendRef.current!.value)

        };


        return (
            <>
                <h3>Game Settings:</h3>
                <div className="grid grid-rows-3 mt-2 gap-y-2 justify-items-end">
                    <div className="flex">
                        <h3 className="text-end self-center">Board rows:</h3>
                        <NumberUpDown max={15} min={3} curr_val={rows} updater={setRows} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Board cols:</h3>
                        <NumberUpDown max={15} min={3} curr_val={cols} updater={setCols} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Board layers:</h3>
                        <NumberUpDown max={15} min={2} curr_val={layers} updater={setLayers} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Starting fences:</h3>
                        <NumberUpDown max={20} min={1} curr_val={start_fences} updater={setStartFences} increment={1} />
                    </div>
                </div>
                <br />
                <div className="flex flex-col">
                    <h3 className="text-center self-center">Invite to game by username</h3>
                    <input onKeyDown={(e) => { if (e.key == 'Enter') sendInvite() }}
                        name="webkit_search_hack" className="bg-transparent rounded-none border-b-2 outline-none"
                        type="text" ref={friendRef} placeholder="username" defaultValue={username} />
                    <button className="font-display w-full mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                        onClick={sendInvite}>INVITE</button>
                </div>
                <p className="my-4 text-center">--- OR ---</p>
                <button onClick={toggleQueueing} className="font-display w-full shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-md border-theme-200 py-1 px-2"
                    >{ queueing ? 'LEAVE' : 'QUICKMATCH' }</button>
                <p className="mt-4 text-center">{numOnline == 1 ? `1 player` : `${numOnline} players`} waiting</p>
            </>
        )
    }
    else {
        // middleware should make this path impossible
        return <h1>Halt right there criminal scum!</h1>
    }

}

type NumberUpDownProps = {
    max: number,
    min: number,
    curr_val: number,
    increment: number,
    updater: React.Dispatch<React.SetStateAction<number>>
}

function NumberUpDown({ max, min, curr_val, increment, updater }: NumberUpDownProps) {
    const upHidden = curr_val == max
    const downHidden = curr_val == min
    const increase = () => {
        updater(Math.min(max, curr_val + increment))
    }

    const decrease = () => {
        updater(Math.max(min, curr_val - increment))
    }

    return (
        <div className="flex justify-end w-14">
            <p className="mx-2 self-center justify-self-center">{curr_val}</p>
            <div className="self-center grid grid-rows-2 h-fit">
                <button onClick={increase} className={`${upHidden ? 'invisible' : '' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                </button>

                <button onClick={decrease} className={`${downHidden ? 'invisible' : '' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
