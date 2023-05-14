import 'server-only'

import { createServerClient } from '../../utils/supabase-server'
import AddRightBorder from '../../components/right-border'
import { mockScores } from '@/utils/mock-data'

export default async function Scoreboard() {
    const supabase = createServerClient()

    const { data, error } = process.env.NEXT_PUBLIC_TESTING ? mockScores : await supabase
        .from('users')
        .select('username, elo')
        .limit(10)
        .order('elo', { ascending: false })

    function getColor(idx: number) {
        switch(idx) {
                case 0: return "text-theme-red"
                case 1: return "text-theme-100"
                case 2: return "text-theme-500"
                default: return "text-gray-200"
        }
    }

    function getPrefix(idx: number) {
        if (idx == 0) return "👑 ";
        else          return `#${idx + 1} `;
    }

    return (
        <div className="mx-auto w-fit">
            <AddRightBorder>
            <div className="mt-10 bg-blue-200 bg-opacity-10 backdrop-blur
                            w-fit text-gray-200 pl-4">
                <table className="border-separate border-spacing-y-4">
                    <thead>
                        <tr className="font-display lg:text-4xl">
                            <th colSpan={2} className="px-8">USERNAME</th>
                            <th className="font-display px-4">ELO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data &&
                            data.map((user, idx) => (
                                <tr key={user.username}>
                                    <td className="text-center">{getPrefix(idx)}</td>
                                    <td className={`font-bold border-gray-500 w-[20ch] max-w-[20ch] truncate border-b-2 ${getColor(idx)}`}>{user.username}</td>
                                    <td className="text-center">{user.elo}</td>
                                </tr>
                            ))}
                </tbody>
            </table>
            </div>
            </AddRightBorder>
        </div>
    )
}