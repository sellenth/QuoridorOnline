'use client'

//import './game-logic/index'
//import { useRef, useCallback } from 'react';
import Engine from './frontend/index'
import { useEffect } from 'react'

export default function GameView() {

    useEffect(() => {
        let engine = new Engine()
        engine.startRenderLoop()
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