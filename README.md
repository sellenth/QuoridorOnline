### Quoridor Online

The goal of this project is to be the one-stop-shop for Quoridor 3D and any variant type games. It will begin with a user authentication system and ability to play a match against another user.

I'll be experimenting with bringing the whole system online using a serverless architecture. The turn based nature of Quoridor should make this possible but I suspect the networked camera movements may be pushing the limits of real time serverless. If it works though, that'd be great for scalability and hosting costs.

If all that works, I'd like to implement a scoreboard and friend system. Potentially game replay feature.

## TODOs

- [x] Login using oauth
- [x] store user in db
- [x] create page showing all users
- [x] add another login method
- [x] render game at some route
- [x] fix double render bug (strict-mode)
- [x] realtime networked cameras
- [x] have fences appear from DB
- [x] have players appear from DB
- [x] have fences counts sync with DB
- [x] have player turn sync with DB
- [x] unify coordinate system for front and back
- [x] serverless function recreates game state
- [x] serverless function validates move
- [x] realtime postgres websockets notify user of move

Sunday 2/25
- [x] handle win state
- [x] add friends list
- [x] create friend request
- [x] accept/decline request
- [x] invite friend to game
- [x] generate new table per game and initialize with default game state

- [x] visual pass over home page
- [x] visual pass over score page
- [x] visual pass over friends page
- [x] visual pass over games page
- [x] visual pass over sign up page
- [ ] sync up turn counter and fence counter

- [ ] update elo with winner of game 
- [ ] clean up game invites after game is won
- [ ] is there a way to enforce uniqueness on two columns as a combination? (game invite table)
- [ ] allow game invite to specify who is p1
- [ ] allow games of different dimensions
- [ ] sanitize inputs
- [ ] validate row/col/layers game input
- [ ] warn user when they are searching for friend/user that doens't exist
- [ ] does move num need to exist on games table?
- [ ] change game table to use gid instead of id

- [ ] track what game a player is currently in
- [ ] flesh out email signup so it isn't hardcoded
- [ ] alert user if signup procces goes wrong (email not confirmed, row not created)
- [ ] update DB policies for table more secure access

## talking points

How to scale to many users
how to prevent cheating
how to create replay system

## dev notes

- `npx supabase start` to start docker containers
- `npm run db-reset` to reset db (Note: this causes problems with realtime container, command also restarts realtime)
- the database will be seeded with supabase/seed.sql
- local db studio available [here](http://localhost:54323/project/default)
- create types based on local db `npx supabase gen types typescript --local > src/utils/db-types.ts`
