'use client'

//import './game-logic/index'
//import { useRef, useCallback } from 'react';
import Script from 'next/script'

declare global {
  interface Window {
    hbspt: any
  }
}


export default function GameView() {

    return (<>
        <Script src="js/frontend/index.js" type="module" />
        <div id="fps">fps: <span></span></div>
        <main>
            <div id="gameInfo">
                <p id="turnIndicator">Player ???'s turn</p>
                <div id="wallInfo">
                    <p>Walls Remaining</p>
                    <p id="myWalls">Me - ???</p>
                    <p id="theirWalls">Them - ???</p>
                </div>
            </div>
            <canvas id="c" tabIndex={0}></canvas>
        </main>
    </>)
}