'use client'

import {useEffect} from 'react'
import Login from '../components/login'
import Engine from './game/frontend/index'


export default function Home() {

  useEffect( () => {
    const engine = new Engine
    engine.startRenderLoop()

    return () => {
        engine.render = false;
    }
  } )

  return (
    <div>
      <h1 className="z-10 absolute bg-blue-200 bg-opacity-10 border-r-2 border-gray-200 py-4 pl-40 pr-10 bottom-10 left-0 text-gray-200 font-bold text-center text-6xl">
        QUORIDOR ONLINE
      </h1>
      <canvas id="c" className="pointer-events-none absolute top-0 left-0 w-full h-full outline-none"></canvas>
    </div>
  )
}
