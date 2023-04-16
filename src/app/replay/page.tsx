'use client'

import {useEffect, useState} from 'react'
import Engine from '../game/frontend/index'
import AddRightBorder from '../../components/right-border'
import { getCookie } from 'cookies-next'
import { useSupabase } from '@/components/supabase-provider'


export default function Replay() {
  const { supabase, session } = useSupabase()
  const [ engine, setEngine ] = useState<Engine | null>(null)
  const [ endGameData, setEndGameData ] = useState<any>(null)
  const [ gameData, setGameData ] = useState<any>(null)
  const [ moveNum, setMoveNum ] = useState<number>(0)

    function back(){
        if (gameData) {
            let newMoveNum = Math.max(0, moveNum - 1)
            let moves = endGameData.moves.slice(0, newMoveNum)
            setMoveNum(newMoveNum)

            setGameData( { ...gameData, moves: moves  } )
        }
    }

    function forward(){
        if (gameData) {
            let newMoveNum = Math.min(endGameData.moves.length, moveNum + 1)
            let moves = endGameData.moves.slice(0, newMoveNum)
            setMoveNum(newMoveNum)

            setGameData( { ...gameData, moves: moves  } )
        }
    }

    useEffect(() => {
        if (engine && gameData) {
            engine.IngestGameState(gameData)
        }
    }, [engine, gameData])

    useEffect(() => {
        if (engine) {
            const gid = getCookie('replay_gid') as string
            engine.startRenderLoop()

            const effectAction = async () => {
                const { data } = await supabase
                    .from('games')
                    .select('*, p1:p1_id(id, username), p2:p2_id(id, username)')
                    .eq('id', gid)
                    .single()

                if (data) {
                    setGameData(data)
                    setEndGameData(data)
                    setMoveNum(data.moves!.length)
                }
            }

            effectAction()

            return () => {
                if (engine) {
                    engine.render = false;
                }
            }

        }

    }, [engine, supabase])

    useEffect(() => {
        setEngine(new Engine())
    }, [])

    return (
      <div>
          <main className="h-full flex flex-col items-center justify-center">
              <canvas id="c" className="mt-10 border border-black square" tabIndex={0}></canvas>
              <div className="grid grid-cols-2 text-gray-200 gap-2">
                <button className="font-display w-full mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                  onClick={back}>back</button>
                <button className="font-display w-full mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                  onClick={forward}>forward</button>
              </div>
          </main>
      </div>
  )
}