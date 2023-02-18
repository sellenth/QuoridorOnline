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
- [x] have walls appear from DB
- [x] have players appear from DB
- [x] have wall counts sync with DB
- [x] have player turn sync with DB
- [x] unify coordinate system for front and back
- [x] serverless function recreates game state
- [ ] generate new table per game and initialize with default game state
- [ ] serverless function validates move
- [ ] flesh out email signup so it isn't hardcoded
- [ ] alert user if signup procces goes wrong (email not confirmed, row not created)

## talking points

How to scale to many users
how to prevent cheating
how to create replay system

## dev notes

- `npx supabase start` to start docker containers
- `npx supabase db reset` to reset db
- the database will be seeded with supabase/seed.sql
- local db studio available [here](http://localhost:54323/project/default)
- create types based on local db `npx supabase gen types typescript --local > src/utils/db-types.ts`
