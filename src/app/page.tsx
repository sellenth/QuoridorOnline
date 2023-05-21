'use client'

import {useEffect} from 'react'
import Engine from './game/core_engine/index'
import AddRightBorder from '../components/right-border'


export default function Home() {

  useEffect( () => {
    const engine = new Engine()
    engine.startRenderLoop()
    engine.setDemoMode(true)
    engine.gameLogic.createDemoScene()

    return () => {
        engine.render = false;
    }
  } )

  return (
    <div>

      <div className="absolute bottom-10 left-0 z-10">
      <AddRightBorder>
      <h1 className="fancy backdrop-blur bg-blue-200 bg-opacity-10 py-4 pl-10 md:pl-20 lg:pl-40 pr-10 text-gray-200 font-bold text-center text-xl md:text-5xl">
        QUORIDOR ONLINE
      </h1>
      </AddRightBorder>
      </div>
      <canvas id="c" className="pointer-events-none absolute top-0 left-0 w-full h-full outline-none"></canvas>
    </div>
  )
}
