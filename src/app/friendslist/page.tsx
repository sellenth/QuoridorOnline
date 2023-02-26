'use client'

import InviteFriend from './invite-friend'
import { useSupabase } from '../../components/supabase-provider'
import AcceptRejectInvite from './accept-reject-invite'
import { useEffect, useState } from 'react'

export const revalidate = 0

export default function FriendsList() {
  const { supabase, session } = useSupabase()

  const my_id = session!.user!.id

  const [accepted, setAccepted] = useState([])
  const [pending, setPending] = useState([])
  const [received_invite, setReceived] = useState([])


  useEffect(() => {
    const channel = supabase
        .channel('friends-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `user_id=eq.${my_id}`
            },
          () => { update_table() }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `friend_id=eq.${my_id}`
            },
          () => { update_table() }
        )
        .subscribe((status: any) => {
            console.log('subscribed to friends table changes')
        })

    const update_table = async () => {
      const my_friends = await supabase
        .from('friends')
        .select('friend:friend_id(username, id), accepted')
        .eq('user_id', session?.user!.id )

      console.log(my_friends)

      if (my_friends.data) {
        setAccepted(my_friends.data.filter( (connection: any) => { return connection.accepted } ))
        setPending(my_friends.data?.filter( (connection: any) => { return !connection.accepted } ))
      }

      const received = await supabase
        .from('friends')
        .select('requester:user_id(username, id), accepted')
        .match({friend_id: session?.user!.id, accepted: false})

      let invites_received = received.data
      if (invites_received) {
        setReceived(invites_received)

      }

    }

    update_table()

      return () => {
          supabase.removeAllChannels()
      }

  }, [])

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
        {received_invite &&
         received_invite.map((user) => (
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