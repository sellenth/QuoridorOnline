import 'server-only'

import { createServerClient } from '../../utils/supabase-server'

// do not cache this page
export const revalidate = 0

// the user will be redirected to the landing page if they are not signed in
// check middleware.tsx to see how this routing rule is set
export default async function Tester() {
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
