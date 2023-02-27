'use client'

import CreateInvite from './create-invite'
import { useSupabase } from '../../components/supabase-provider'
import AcceptRejectInvite from './accept-reject-invite'
import { useEffect, useState } from 'react'
import InviteToGame from './invite-to-game'
import { useSearchParams } from 'next/navigation'
import JoinGame from './join-game'

export const revalidate = 0

export default function FriendsList() {
  let searchParams = useSearchParams()
  let username = searchParams.get('username') ?? ''
  const { supabase, session } = useSupabase()

  const my_id = session!.user!.id

  const [sent, setSent] = useState([])
  const [received, setReceived] = useState([])
  const [inProgress, setInProgress] = useState([])


  useEffect(() => {
    const channel = supabase
        .channel('game-invites-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game-invites',
                filter: `initiator_id=eq.${my_id}`
            },
          () => { update_table() }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'game-invites',
                filter: `opponent_id=eq.${my_id}`
            },
          () => { update_table() }
        )
        .subscribe((status: any) => {
            console.log('subscribed to game-invites table changes')
        })

    const update_table = async () => {
      const invitesResponse = await supabase
        .from('game-invites')
        .select('initiator:initiator_id(username, id), opponent:opponent_id(username, id), gid, rows, cols, layers')
        .or(`initiator_id.eq.${ my_id },opponent_id.eq.${ my_id }`)

      console.log(invitesResponse)
      let invites = invitesResponse.data

      if (invites) {
        setSent(invites.filter( (invite: any) =>       { return invite.initiator.id == my_id && invite.gid == null } ))
        setReceived(invites.filter( (invite: any) =>   { return invite.opponent.id  == my_id && invite.gid == null } ))
        setInProgress(invites.filter( (invite: any) => { return invite.gid != null } ))
      }

    }

    update_table()

      return () => {
          supabase.removeAllChannels()
      }

  }, [])

  return (
    <>
    <CreateInvite my_id={my_id} username={username} />
    <div className="mt-10 border-2 border-black">
      <h3>Game invites sent</h3>
      <table>
        <thead>
          <tr>
            <th>Username</th>
          </tr>
        </thead>
        <tbody>
          {sent &&
          sent.map((game) => (
              <tr key={game.opponent.id}>
                <td>{game.opponent.username}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    <div className="mt-10 border-2 border-black">
      <h3>Game invites received</h3>
      <table>
        <thead>
          <tr>
            <th>Username</th>
          </tr>
        </thead>
        <tbody>
          {received &&
          received.map((game) => (
              <tr key={game.initiator.id}>
                <td>
                  {game.initiator.username}
                  <AcceptRejectInvite initiator_id={game.initiator.id} opponent_id={game.opponent.id}/>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>

    <div className="mt-10 border-2 border-black">
      <h3>Games in progress</h3>
      <table>
        <thead>
          <tr>
            <th>Opponent</th>
          </tr>
        </thead>
        <tbody>
          {inProgress &&
          inProgress.map((game: any) => {
            console.log(game)
              let their_id = game.initiator.id == my_id ? game.opponent.id : game.initiator.id
              let their_name = game.initiator.id == my_id ? game.opponent.username : game.initiator.username

            return (
              <tr key={their_id}>
                <td>
                  {their_name}
                  <JoinGame gid={game.gid} />
                </td>
              </tr>
              )
          })}
        </tbody>
      </table>
    </div>
    </>
  )
}