'use client'

//import './game-logic/index'
//import { useRef, useCallback } from 'react';
import Engine from './frontend/index'
import { useEffect } from 'react'
import { useSupabase } from '../../components/supabase-provider'
import { getCookie } from 'cookies-next'
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

export default function GameView() {
    const { supabase, session } = useSupabase()

    useEffect(() => {
        let engine: Engine = new Engine(supabase)
        engine.gameLogic.assignId(session?.user.id ?? "NA");
        console.log(session?.user.id)
        engine.startRenderLoop()
        let gid = getCookie('current_gid')
        console.log(gid)
        engine.networkTick(gid)


        const channel = supabase
            .channel('value-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'games',
                },
                () => { engine.networkTick(gid) }
            )
            .subscribe((status: any) => {
                console.log('nice:', status)
            })

        const camChannel = supabase.channel('room1')
        // Subscribe registers your client with the server
        camChannel
            .on('broadcast', { event: 'camera-pos' }, (p: any) => { engine.updateNetworkedCameras(p.payload) })
            .subscribe((status: any) => {
                if (status === 'SUBSCRIBED') {
                    // now you can start broadcasting cursor positions
                    setInterval(() => {
                        camChannel.send({
                            type: 'broadcast',
                            event: 'camera-pos',
                            payload: [
                                session?.user.id,
                                engine.PackageCameraAsNetPayload(),
                            ]
                        })
                    }, 1000)
                }
            })
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