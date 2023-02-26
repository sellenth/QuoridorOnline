import InviteFriend from './invite-friend'
import { createServerClient } from '../../utils/supabase-server'
import AcceptRejectInvite from './accept-reject-invite'

export const revalidate = 0

export default async function FriendsList() {
  const supabase = createServerClient()
  const {
      data: { user },
  } = await supabase.auth.getUser()

  const my_id = user!.id

  const my_friends = await supabase
    .from('friends')
    .select('friend:friend_id(username, id), accepted')
    .eq('user_id', user!.id )

  let accepted = my_friends.data?.filter( (connection: any) => { return connection.accepted } ) ?? []
  let pending = my_friends.data?.filter( (connection: any) => { return !connection.accepted } ) ?? []

  const received = await supabase
    .from('friends')
    .select('requester:user_id(username, id), accepted')
    .match({friend_id: user!.id, accepted: false})

  let invites_received = received.data

  return (
    <>
    <InviteFriend />
      <h3 className="mt-10">Invites sent</h3>
    <table>
      <thead>
        <tr>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        {accepted &&
         pending.map((user) => (
            <tr key={user.friend.id}>
              <td>{user.friend.username}</td>
            </tr>
          ))}
      </tbody>
    </table>

      <h3 className="mt-10">Invites received</h3>
    <table>
      <thead>
        <tr>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        {invites_received &&
         invites_received.map((user) => (
            <tr key={user.requester.id}>
              <td>
                {user.requester.username}
                <AcceptRejectInvite my_id={my_id} requester_id={user.requester.id}/>
              </td>
            </tr>
          ))}
      </tbody>
    </table>

      <h3 className="mt-10">Friends</h3>
    <table>
      <thead>
        <tr>
          <th>Username</th>
        </tr>
      </thead>
      <tbody>
        {accepted &&
         accepted.map((user) => (
            <tr key={user.friend.id}>
              <td>{user.friend.username}</td>
            </tr>
          ))}
      </tbody>
    </table>
    </>
  )
}