'use client'

import Engine from './frontend/index'
import { useEffect, useRef, useState } from 'react'
import { useSupabase } from '../../components/supabase-provider'
import { getCookie } from 'cookies-next'
import { GamePad } from './gamepad'


export default function GameView() {
    const { supabase, session } = useSupabase()
    const fpsCounterRef = useRef(null)
    const gameInfoRef = useRef(null)
    const gamePad = useRef<HTMLDivElement>(null);
    const [engine, setEngine] = useState<Engine | undefined>();

    useEffect(() => {
        const gid = getCookie('current_gid') as string
        const engine = new Engine()
        setEngine(engine)

        engine.registerDbClient(supabase, gid)

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
                },
                () => {
                    engine.networkTick(gid);
                }
            )
            .subscribe((status: any) => {
                console.log('game realtime channel:', status)
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
            supabase.removeChannel(channel)
            engine.render = false;
        }

    }, [session?.user.id, supabase])

    return (<>
        <div id="fps" className="absolute left-5 bottom-5 text-gray-200">fps:
            <span ref={fpsCounterRef} ></span>
        </div>
        <main className="h-fit w-fit flex flex-col items-center justify-center mx-auto my-10 ">

            <div ref={gameInfoRef} id="gameInfo" className="w-full text-gray-200 self-start mb-5 flex">
                <div>
                    <p id="turnIndicator">Player ???&apos;s turn</p>
                    <div id="fenceInfo">
                        <p>Fences Remaining</p>
                        <p id="myFences">Me - ???</p>
                        <p id="theirFences">Them - ???</p>
                    </div>
                </div>
                <div id="gamePad" className="justify-self-end self-end ml-auto hidden" ref={gamePad}>
                    <GamePad engine={engine}/>
                </div>
            </div>

            <canvas id="c" className="border border-gray-200 outline-none square" tabIndex={0}></canvas>


        </main>
    </>)
}