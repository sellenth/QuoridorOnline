'use client'

import Engine from './frontend/index'
import { useEffect, useRef, useState } from 'react'
import { useSupabase } from '../../components/supabase-provider'
import { getCookie } from 'cookies-next'

export default function GameView() {
    const [ left, setLeft ] = useState( () => () => {} )
    const [ right, setRight ] = useState( () => () => {} )
    const [ commit, setCommit ] = useState( () => () => {} )

    const { supabase, session } = useSupabase()
    const fpsCounterRef = useRef(null)
    const gameInfoRef = useRef(null)

    useEffect(() => {
        const gid = getCookie('current_gid') as string
        const engine = new Engine()

        engine.registerDbClient(supabase, gid)

        fpsCounterRef.current && engine.setFpsCounterElement(fpsCounterRef.current)
        gameInfoRef.current && engine.setGameInfoElement(gameInfoRef.current)

        engine.gameLogic.assignId(session?.user.id ?? "NA");
        engine.startRenderLoop()
        engine.networkTick(gid)
        setLeft( () => () => {engine.gameLogic.PreviousPlayerCursor()} )
        setRight( () => () => {engine.gameLogic.NextPlayerCursor()} )
        setCommit( () => () => {engine.gameLogic.commitMove()} )

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

                <div id="gamePad" className="justify-self-end self-end flex flex-cols-3 gap-1 mt-4 ml-auto">
                    <button onClick={left} className="border border-gray-200 text-gray-200 rounded-md h-10 w-28">
                        <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953l7.108-4.062A1.125 1.125 0 0121 8.688v8.123zM11.25 16.811c0 .864-.933 1.405-1.683.977l-7.108-4.062a1.125 1.125 0 010-1.953L9.567 7.71a1.125 1.125 0 011.683.977v8.123z" />
                        </svg>
                    </button>
                    <button onClick={commit} className="border border-gray-200 text-gray-200 rounded-md flex h-10 w-28">
                        <p className="w-fit m-auto font-bold">
                            COMMIT
                        </p>
                    </button>
                    <button onClick={right} className="border border-gray-200 text-gray-200 rounded-md h-10 w-28">
                        <svg className="m-auto h-[90%]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z" />
                        </svg>
                    </button>
                </div>
            </div>

            <canvas id="c" className="border border-gray-200 outline-green square" tabIndex={0}></canvas>


        </main>
    </>)
}