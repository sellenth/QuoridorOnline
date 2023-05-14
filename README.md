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

- [x] update elo with winner of game 
- [x] allow games of different dimensions
- [x] flesh out email signup so it isn't hardcoded
- [x] basic replay system with forward/backwards
- [x] clean up game invites after game is won
- [x] sync up turn counter and fence counter

Wednesday 4/5
- [x] rework player move logic to support leap frog

Thursday 4/6
- [x] work on 2d mode which disables certain move types
- [x] create new pawn model
- [x] make the player colors more distinct

Sunday 4/16
- [x] host on internet

Sunday 4/23
- [x] update grid to indicate end zone for each player
- [x] update pawn model again
- [x] better anti-aliasing

Sunday 5/7
- [x] (stretch) add mobile controls on 2d game board
- [x] color username on game page for understandability
- [x] pulse the game border box when it's your turn

Sunday 5/13
- [x] mobile styling
- [x] tell user if username/email already used, to check email to confirm
- [x] *alert user if signup procces goes wrong (email not confirmed, row not created)
- [x] *warn user when they are searching for friend/user that doesn't exist
- [ ] *have instructions popup

- [ ] implement quick game feature to pair with another online user

- [ ] timeout condition for game end
- [ ] (stretch) allow spectating top 3's current game
- [ ] add challenge button on leaderboard

- [ ] display row/col/layer info on games page
- [ ] is there a way to enforce uniqueness on two columns as a combination? (game invite table)
- [ ] allow game invite to specify who is p1
- [ ] sanitize inputs
- [ ] validate row/col/layers game input
- [ ] does move num need to exist on games table?
- [ ] change game table to use gid instead of id

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
- create types based on local db `npm run generate-types`
- on every new vercel deployment, update github oauth QO-supabase and supabase.com > authentication > configuration > URL configuration
- to push edge function `npx supabase functions deploy handle-move`