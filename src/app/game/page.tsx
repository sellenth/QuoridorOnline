'use client'

//import './game-logic/index'
//import { useRef, useCallback } from 'react';
import Engine from './frontend/index'
import { useEffect } from 'react'
import { useSupabase } from '../../components/supabase-provider'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

export default function GameView() {
    const { supabase, session } = useSupabase()

    useEffect(() => {
        let engine = new Engine()
        engine.gameLogic.assignId(session?.user.id ?? "NA");
        engine.startRenderLoop()
        /*
        const channel = supabase.channel('room1')

        // Subscribe registers your client with the server
        channel
        .on('broadcast', { event: 'camera-pos' }, (p) => engine.updateNetworkedCameras(p.payload))
        .subscribe((status: any) => {
            if (status === 'SUBSCRIBED') {
                // now you can start broadcasting cursor positions
                setInterval(() => {
                    channel.send({
                        type: 'broadcast',
                        event: 'camera-pos',
                        payload: [
                            session?.user.id,
                            engine.PackageCameraAsNetPayload(),
                        ]
                    })
                    console.log(status)
                }, 1000)
            }
        })*/

        async function getGameState(supabase: SupabaseClient) {
            // fetch game state
            const { data } = await supabase
                .from('test-game')
                .select('*')
                .limit(1)
                .order('move_num', { ascending: true })
                .single()

            engine.IngestGameState(data)

            /*
            const { edge_data, error } = await supabase.functions.invoke('hello-world', {
            body: { name: 'bar' }
            })
            console.log(edge_data)
            */
        }

        getGameState(supabase)

        return () => {
            supabase.removeAllChannels()
            engine.render = false;
        }

    }, [])

    return (<>
        {/*<Script src="js/frontend/index.js" type="module" />*/}
        <div id="fps" className="absolute">fps: <span></span></div>
        <main className="h-full flex flex-col items-center justify-center">
            <div id="gameInfo" className="">
                <p id="turnIndicator">Player ???&apos;s turn</p>
                <div id="wallInfo">
                    <p>Walls Remaining</p>
                    <p id="myWalls">Me - ???</p>
                    <p id="theirWalls">Them - ???</p>
                </div>
            </div>
            <canvas id="c" className="border border-black h-1/2 w-5/6" tabIndex={0}></canvas>
        </main>
    </>)
}