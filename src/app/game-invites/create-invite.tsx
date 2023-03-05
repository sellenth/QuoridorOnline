'use client'
import { useSupabase } from '../../components/supabase-provider'
import { useRef, useState } from 'react'


type props = {
    username: string
    my_id: string
}

export default function CreateInvite( { username, my_id }: props) {
    const { supabase, session } = useSupabase()
    const friendRef = useRef<HTMLInputElement>(null)
    const [rows, setRows] = useState(9)
    const [cols, setCols] = useState(9)
    const [layers, setLayers] = useState(3)
    const [fences, setFences] = useState(15)

    if (session && session.user.id) {
        const sendInvite = () => {
            async function createInviteUsingUsername( username: string ) {
                const { data, error } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', username)

                console.log(data, error)

            // we have their id, create a game invite
            if (data && data.length > 0) {
                let rows = rowRef.current?.value ?? 9
                let cols = rowRef.current?.value ?? 9
                let layers = rowRef.current?.value ?? 3
                const { error } = await supabase
                    .from('game-invites')
                    .insert({ initiator_id: my_id, opponent_id: data[0].id, rows: rows, cols: cols, layers: layers })

                if (error) {
                    console.log(error)
                }

            }
            }

            createInviteUsingUsername(friendRef.current!.value)

        }

        return (
            <>
                <h3 className="text-center self-center">Invite to game by username</h3>
                <input className="bg-transparent border-b-2 outline-none" type="text" ref={friendRef} placeholder="username" defaultValue={username} />
                <div className="grid grid-rows-3 mt-2 gap-y-2 justify-items-end">
                    <div className="flex">
                        <h3 className="text-end self-center">Board rows:</h3>
                        <NumberUpDown max={15} min={3} curr_val={rows} updater={setRows} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Board cols:</h3>
                        <NumberUpDown max={15} min={3} curr_val={cols} updater={setCols} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Board layers:</h3>
                        <NumberUpDown max={15} min={3} curr_val={layers} updater={setLayers} increment={1} />
                    </div>
                    <div className="flex">
                        <h3 className="text-end self-center">Starting fences:</h3>
                        <NumberUpDown max={20} min={1} curr_val={fences} updater={setFences} increment={1} />
                    </div>
                </div>

                <button className="font-display w-full mt-2 shadow-lg hover:bg-theme-200 hover:shadow-theme-200/50 border-2 rounded-b-md border-theme-200 py-1 px-2"
                    onClick={sendInvite}>invite</button>
            </>
        )
    }
    else {
        // middleware should make this path impossible
        return <h1>Halt right there criminal scum!</h1>
    }

}

type NumberUpDownProps = {
    max: number,
    min: number,
    curr_val: number,
    increment: number,
    updater: React.Dispatch<React.SetStateAction<number>>
}

function NumberUpDown({ max, min, curr_val, increment, updater }: NumberUpDownProps) {
    const upHidden = curr_val == max
    const downHidden = curr_val == min
    const increase = () => {
        updater(Math.min(max, curr_val + increment))
    }

    const decrease = () => {
        updater(Math.max(min, curr_val - increment))
    }

    return (
        <div className="flex justify-end w-14">
            <p className="mx-2 self-center justify-self-center">{curr_val}</p>
            <div className="self-center grid grid-rows-2 h-fit">
                <button onClick={increase} className={`${upHidden ? 'invisible' : '' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                </button>

                <button onClick={decrease} className={`${downHidden ? 'invisible' : '' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
