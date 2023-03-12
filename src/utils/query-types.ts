export type FriendConnection = {
  friend: {
    username: string,
    id: string,
  },
  accepted: boolean
}

export type IncomingFriendInvite = {
  requester: {
    username: string,
    id: string,
  },
  accepted: boolean
}

export type GameInvite = {
  initiator: {
    username: string,
    id: string
  },
  opponent: {
    username: string,
    id: string,
  }
  gid: null | string,
  rows: number,
  cols: number,
  layers: number,
  start_fences: number
}