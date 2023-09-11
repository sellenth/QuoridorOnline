import { FriendConnection, GameInvite, IncomingFriendInvite } from "./query-types"

export const mockMyUsername = 'bigHuntah'
export const mockMyId = "13375757-eee0-4e53-9246-2bc83ffcac54"

export const mockConnections: FriendConnection[] = [
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

export const mockInvites: IncomingFriendInvite[] = [
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

export const mockIncomingGameInvite: GameInvite[] = [
  { // a game invite I'm receiving
    initiator: {
      username: "cowboY",
      id: "1234"
    },
    opponent: {
      username: mockMyUsername,
      id: mockMyId
    },
    gid: null,
    rows: 6,
    cols: 6,
    layers: 1,
    p1_time: "1337-01-05T00:00:00Z",
    p2_time: "1337-01-05T00:00:00Z",
    start_fences: 10,
    game: { winner: null }
  },
]
export const mockSentGameInvite: GameInvite[] = [
  { // a game invite I'm sending
    initiator: {
      username: mockMyUsername,
      id: mockMyId
    },
    opponent: {
      username: "hackerr",
      id: "1235"
    },
    gid: null,
    rows: 10,
    cols: 10,
    layers: 2,
    p1_time: "1337-01-05T00:00:00Z",
    p2_time: "1337-01-05T00:00:00Z",
    start_fences: 10,
    game: { winner: null }
  },
]
export const mockInProgressGameInvite: GameInvite[] = [
  { // a game I'm playing that's in progress
    initiator: {
      username: mockMyUsername,
      id: mockMyId
    },
    opponent: {
      username: "al1c3",
      id: "1238"
    },
    gid: "c0ff33",
    rows: 9,
    cols: 9,
    layers: 3,
    start_fences: 10,
    game: { winner: null }
  },
]


export const mockScores = {
    data: [
        { username: "Player 1", elo: 600 },
        { username: "GamerX", elo: 550 },
        { username: "action_adventurer", elo: 500 },
        { username: "ultraWin", elo: 489 },
        { username: "howdoiplayquoridor", elo: 300 },
        ],
    error: null
}
