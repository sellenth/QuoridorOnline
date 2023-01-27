import 'server-only'

import { createServerClient } from '../../utils/supabase-server'

export const revalidate = 0

export default async function Scoreboard() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('users')
    .select('username, elo')
    .order('elo', { ascending: false })

  return (
    <table>
      <thead>
        <tr>
          <th>Username</th>
          <th>Elo</th>
        </tr>
      </thead>
      <tbody>
        {data &&
          data.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.elo}</td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
