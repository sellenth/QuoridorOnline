'use client'

import InviteFriend from './invite-friend'
import { useSupabase } from '../../components/supabase-provider'
import AcceptRejectInvite from './accept-reject-invite'
import { useEffect, useState } from 'react'
import InviteToGame from './invite-to-game'
import { Database } from '../../utils/db-types'
import AddRightBorder, { AddBottomBorder, AddFullBorder, AddTopBorder } from '@/components/right-border'
import { DecorativeCircles } from '@/components/decordatives'

const testing = true

function subscribeToDbChanges(supabase: any, id: string, callback: () => any ){
    const channel = supabase
        .channel('friends-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `user_id=eq.${id}`
            },
          () => { callback() }
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `friend_id=eq.${id}`
            },
          () => { callback() }
        )
        .subscribe((status: any) => {
            console.log('subscribed to friends table changes')
        })
  //TODO notify on errors from channel
}


type FriendConnection = {
  friend: {
    username: string,
    id: string,
  },
  accepted: boolean
}

const mockConnections = [
  {
    friend: {
      username: 'gamerX',
      id: '1234',
    },
    accepted: true
  },
  {
    friend: {
      username: 'bigHuntah',
      id: '1235',
    },
    accepted: true
  },
  {
    friend: {
      username: 'cowboY',
      id: '1237',
    },
    accepted: false
  },
  {
    friend: {
      username: 'rudolph',
      id: '1242',
    },
    accepted: true
  },
]

type IncomingFriendInvite = {
  requester: {
    username: string,
    id: string,
  },
  accepted: boolean
}
const mockInvites = [
  {
    requester: {
      username: 'howdoyouplayquoridor',
      id: '1111',
    },
    accepted: false
  },
  {
    requester: {
      username: 'al1c3',
      id: '9499',
    },
    accepted: false
  },
]

export default function FriendsList() {
  const { supabase, session } = useSupabase()

  const my_id = session?.user!.id || ''

  const [accepted, setAccepted] = useState<FriendConnection[]>([])
  const [pending, setPending] = useState<FriendConnection[]>([])
  const [received_invite, setReceived] = useState<IncomingFriendInvite[]>([])

  const getMyFriendsFromDb = async () => {
        const { data, error } = await supabase
          .from('friends')
          .select('friend:friend_id(username, id), accepted')
          .eq('user_id', my_id )

      return data as FriendConnection[]
  }

  const getFriendRequestsFromDb = async () => {
    const {data, error} = await supabase
      .from('friends')
      .select('requester:user_id(username, id), accepted')
      .match({friend_id: my_id, accepted: false})

    return data as IncomingFriendInvite[]
  }

  const updateFriendsList = (my_friends: FriendConnection[], my_invites: IncomingFriendInvite[] ) => {
    setAccepted(my_friends.filter( (friend) => { return friend.accepted } ))
    setPending(my_friends.filter( (friend) => { return !friend.accepted } ))
    setReceived(my_invites)
  }

  const updateFriendsListFromDb = async () => {
    const my_friends = await getMyFriendsFromDb()
    const my_invites = await getFriendRequestsFromDb()
    updateFriendsList(my_friends, my_invites)
  }

  useEffect(() => {

    if (testing) {
      updateFriendsList(mockConnections, mockInvites)
    } else {
      subscribeToDbChanges(supabase, my_id, updateFriendsListFromDb);
      updateFriendsListFromDb()
    }

    return () => {
        supabase.removeAllChannels()
    }

  }, [])

    return (
        <div className="text-gray-200 mx-auto w-fit ">
            <div className="w-fit grid grid-rows-3 align-center mx-auto my-10 bg-blue-200 bg-opacity-10 backdrop-blur p-4 border-2 border-gray-200 rounded-md">
                <InviteFriend />
            </div>

            <AddRightBorder>
                <div className="bg-blue-200 bg-opacity-10 backdrop-blur p-4">
                    <table>
                        <thead>
                            <tr>
                                <th>INVITES SENT</th>
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
                </div>
            </AddRightBorder>

            <DecorativeCircles />

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-200 bg-opacity-10 backdrop-blur border-2 border-gray-200 p-2 rounded-l-md">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="text-start">INVITES RECEIVED</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {received_invite &&
                                received_invite.map((user) => (
                                    <tr key={user.requester.id}  className="h-9">
                                        <td>
                                            {user.requester.username}
                                        </td>
                                        <td className="text-end">
                                            <AcceptRejectInvite my_id={my_id} requester_id={user.requester.id} />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-blue-200 bg-opacity-10 backdrop-blur border-2 border-gray-200 p-2 rounded-r-md">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr>
                                <th className="text-start">FRIENDS</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {accepted &&
                                accepted.map((user) => (
                                    <tr key={user.friend.id} className="h-9">
                                        <td>
                                            {user.friend.username}
                                        </td>
                                        <td className="text-end">
                                            <InviteToGame friend_username={user.friend.username} />
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}