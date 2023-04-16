'use client'
import { useSupabase } from "@/components/supabase-provider"
import { useRouter } from 'next/navigation';
import { useEffect, useState } from "react";
import { setCookie } from 'cookies-next'

type PastGame = {
  p1: {
    username: string
  },
  p2: {
    username: string
  },
  id: string,
  winner: string | null
}


function PastGamesTable( { pastGames, my_id }: { pastGames: PastGame[], my_id: string }) {

  return (
    <div className="my-5">
        <h1>Past Games:</h1>
        <table className="w-full">
            <thead>
                <tr>
                    <th className="text-start">P1</th>
                    <th className="text-start">P2</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {
                    pastGames.map((pastGame) => (
                        <tr key={pastGame.id}>
                            <td>{pastGame.p1.username}</td>
                            <td>{pastGame.p2.username}</td>
                            <td className="text-end">
                              <GameReviewItem pastGame={pastGame} my_id={my_id} />
                            </td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
    </div>
    )
}

function GameReviewItem( { pastGame, my_id }: { pastGame: PastGame, my_id: string }) {
  const router = useRouter()

  const analyze = () => {
    console.log('analyzing')
    setCookie('replay_gid', pastGame.id)
    router.push('/replay')
  }

  let i_won = pastGame.winner == my_id

  return (
    <>
      <p className={ `bg-theme-300 rounded-md ${i_won ? 'text-theme-500' : 'text-theme-red'} inline-block mx-2 px-2 py-1` }>
        {i_won ? 'won' : 'lost'}
      </p>
        <button
            className="font-display shadow-lg hover:bg-theme-500 h-8 hover:shadow-theme-500/50 border-2 rounded-md border-theme-500 px-2 py-0 "
            onClick={analyze}>
            review
        </button>
    </>
  )
}

export default function AccountPage (){
  const { supabase, session } = useSupabase()
  const my_id = session?.user!.id || ''
  const [ pastGames, setPastGames ] = useState<PastGame[]>([])

  let username = session?.user.user_metadata.preferred_username ?? null

  useEffect( () => {
    const effectAction = async () => {
        const { data, error } = await supabase
            .from('games')
            .select('id, p1:p1_id(username), p2:p2_id(username), winner')
            .or(`p1_id.eq.${my_id},p2_id.eq.${my_id}`)
            .not('winner', 'is', null)

      if (data) {
        setPastGames( data as PastGame[] )
      }
    }

    effectAction()
  }, [my_id, supabase])

  const handleLogout = async () => {
      const { error } = await supabase.auth.signOut()

      if (error) {
          console.log({ error })
      }

    window.location.href = "/"
  }

return <div className="text-gray-200">
        <div className="max-w-sm align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
            <h1 className="my-2 underline font-display">{username}</h1>
            {
            pastGames.length > 0 && <PastGamesTable pastGames={pastGames} my_id={my_id} />
            }

            <button onClick={handleLogout} className="font-display w-full my-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
          >Logout</button>
        </div>
    </div>
}