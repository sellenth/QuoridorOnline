'use client'

import Engine from './core_engine/index'
import { useEffect, useRef, useState } from 'react'
import { useSupabase } from '../../components/supabase-provider'
import { getCookie } from 'cookies-next'
import { GamePad } from './gamepad'
import { User } from '@supabase/supabase-js'

export default function GameView() {
    const { supabase, session } = useSupabase()
    const fpsCounterRef = useRef(null)
    const gameInfoRef = useRef(null)
    const gamePad = useRef<HTMLDivElement>(null);
    const [engine, setEngine] = useState<Engine | undefined>()
    const [user, setUser] = useState<User | null>(null);


      useEffect(() => {
          const gid = getCookie('current_gid') as string
          const engine = new Engine()
        setEngine(engine)

        engine.registerDbClient(supabase, gid);

        fpsCounterRef.current && engine.setFpsCounterElement(fpsCounterRef.current)
        gameInfoRef.current && engine.setGameInfoElement(gameInfoRef.current)

        engine.gameLogic.assignId(session?.user.id ?? "NA");

        ( async () => {
            await engine.networkTick(gid);
            if (gamePad?.current && !engine.gameLogic._3dMode) {
                gamePad.current.style.display = "block"
            }
            }
        )();
        engine.startRenderLoop();


        const channel = supabase
            .channel('value-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'games',
                    filter: `id=eq.${gid}`
                },
                (payload) => {
                    engine.networkTick_payload(payload.new);
                }
            )
            .subscribe((status: any) => {
                console.log('game realtime channel:', status)
            })

        const camChannel = supabase.channel(gid);
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
            supabase.removeChannel(channel);
            supabase.removeChannel(camChannel);
            engine.render = false;
        }

    }, [session?.user.id, supabase])

    return (<>
        <div id="fps" className="absolute left-5 bottom-5 text-gray-200 hidden">fps:
            <span ref={fpsCounterRef} ></span>
        </div>
        <main className="h-full flex flex-col items-center justify-center mx-4">

            <div ref={gameInfoRef} id="gameInfo" className="z-10 w-full text-gray-200 self-start my-2 h-3 flex-none flex">
                <p id="turnIndicator" className="w-full text-center">Player ???&apos;s turn</p>
            </div>

            <div className="max-w-full aspect-square grow relative text-gray-200">
                <div className="absolute z-10 left-3 top-1">
                    <p id="p1Fences">Me - ???</p>
                    <p className="text-end" id="p1Time">__:__</p>
                </div>
                <div className="absolute z-10 right-3 top-1">
                    <p id="p2Fences">Them - ???</p>
                    <p className="text-end" id="p2Time">__:__</p>
                </div>
                <canvas id="c" className="z-0 border border-gray-200 outline-none w-full h-full" tabIndex={0} />
            </div>
            <div id="gamePad" className="z-10 mx-auto flex-initial my-2 lg:w-1/4 md:w-1/2 w-full flex-none" ref={gamePad}>
                <GamePad engine={engine} />
            </div>


        </main>
    </>)
}