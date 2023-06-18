// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { writeAllSync } from 'https://deno.land/std@0.177.0/streams/write_all.ts'
import { inBounds, isValidPawnMove, validHeading, addFenceToGameSpace, EXPLORED, Extents, FENCE, generateGameSpace, GameSpace, PLAYER, VACANT, applyMovesToGameSpace, MoveType, s, Move, Player  } from '../_shared/game-space.ts'

const fence = new TextEncoder().encode('F')
const no_fence = new TextEncoder().encode('0')
const player = new TextEncoder().encode('P')
const empty = new TextEncoder().encode(' ')
const newline = new TextEncoder().encode('\n')
const tab = new TextEncoder().encode('\t')

export const extents: Extents = {
    near: 0,
    far: 18,

    left: 0,
    right: 18,

    bottom: 0,
    top: 6,
}

serve(async (req: any) => {
    // required for invoking from browser
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    let ingest_time = new Date();

    try {
        // Create a Supabase client with the Auth context of the logged in user.
        const supabaseClient = createClient(
            // Supabase API URL - env var exported by default.
            Deno.env.get('SUPABASE_URL') ?? '',
            // Supabase API ANON KEY - env var exported by default.
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            // Create client with Auth context of the user that called the function.
            // This way your row-level-security (RLS) policies are applied.
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )
        // Now we can get the session or user object
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            console.log('user doesnt exists')
            return new Response(JSON.stringify({ error: "user doesn't exist" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const { game_id, proposed_move, msg } = await req.json()

        // Get the game record
        const { data, error } = await supabaseClient
            .from('games')
            .select('*')
            .eq('id', game_id)
            .single()
        if (error) throw error

        if (msg == 'giveup') {
            let opponentID = data.p1_id == user.id ? data.p2_id : data.p1_id;
            await updateElo(supabaseClient, opponentID, user.id)
            const update_res = await supabaseClient
                .from('games')
                .update({ winner: opponentID })
                .eq('id', game_id)
            return endGame(supabaseClient, game_id, 'Someone weenied out!');

        }

        if (data.moves.length == 63) {
            await updateElo(supabaseClient, data.p2_id, data.p1_id)
            const update_res = await supabaseClient
                .from('games')
                .update({ winner: data.p2_id })
                .eq('id', game_id)
            return endGame(supabaseClient, game_id, 'p1 was too slow (64 move limit has been reached)');
        }

        // Check if this game is over
        if (data.winner != null) {
            return new Response(JSON.stringify({ res: `${data.winner} won!` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // if the move list length is even, that means it is player 2's turn
        const p2_move = !!(data.moves.length % 2)

//////////////
        const last_update = await supabaseClient
            .from('games')
            .select('last_update, p1_time, p2_time')
            .eq('id', game_id)
            .single()

        if (last_update.error) throw last_update.error;

        let p1_time = new Date(last_update.data.p1_time);
        let p2_time = new Date(last_update.data.p2_time);

        // if the game is underway, check if the clock has expired
        if (last_update.data.last_update) {
            let last_t = new Date(last_update.data.last_update);
            let diff = (ingest_time.getTime() - last_t.getTime());

            if (p2_move) {
                p2_time = new Date( p2_time.getTime() - diff );
            } else {
                p1_time = new Date( p1_time.getTime() - diff );
            }

            let p1_expired = p1_time.getFullYear() < 1337;
            let p2_expired = p2_time.getFullYear() < 1337;

            // End game early if one player's timer expires
            if (p2_move && p2_expired) {
                console.log('game over, p1 wins')
                let winner = data.p1_id
                await updateElo(supabaseClient, winner, data.p2_id)
                const update_res = await supabaseClient
                    .from('games')
                    .update({ p2_time: p2_time.toISOString(), winner: winner })
                    .eq('id', game_id)
                return endGame(supabaseClient, game_id, 'p1 won');

            }
            else if(!p2_move && p1_expired) {
                let winner = data.p2_id
                await updateElo(supabaseClient, winner, data.p1_id)
                const update_res = await supabaseClient
                    .from('games')
                    .update({ p1_time: p1_time.toISOString(), winner: winner })
                    .eq('id', game_id)
                return endGame(supabaseClient, game_id, 'p2 won');
            }
        }
//////////////


        // reject a move from anyone but current player
        if (
            (p2_move && data.p2_id != user.id) ||
            (!p2_move && data.p1_id != user.id)
        ) {
            return new Response(
                JSON.stringify({ error: "you aren't the current player" }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 401,
                }
            )
        }

        // set extents for this game space
        extents.far = data.rows * 2
        extents.right = data.cols * 2
        extents.top = data.layers * 2

        // calculate specific positions on the game board for player starts and ends
        const p2_start_row = data.rows * 2 - 1
        const p_start_col = data.cols % 2 ? data.cols : data.cols - 1
        const p_start_layer = data.layers % 2 ? data.layers : data.layers - 1

        let gameSpace = generateGameSpace(extents)
        const p1: Player = { id: data.p1_id, goalZ: p2_start_row, numFences: 15, pos: [p_start_col, p_start_layer, 1] };
        const p2: Player = { id: data.p2_id, goalZ: 1, numFences: 15, pos: [p_start_col, p_start_layer, p2_start_row] }

        applyMovesToGameSpace(gameSpace, data.moves, p1, p2)

        const _3dMode = data.layers > 2
        let isValid = true
        let winner = null
        let verified_move!: Move;

        // Check proposed player move
        if (proposed_move[0] == MoveType.Pawn) {
            const curr_player = p2_move ? p2 : p1;
            const other_player = p2_move ? p1 : p2;

            isValid = isValidPawnMove(gameSpace, extents, _3dMode, proposed_move, curr_player, other_player)
            if (isValid) {
                curr_player.pos[0] += proposed_move[s.x]
                curr_player.pos[1] += proposed_move[s.y]
                curr_player.pos[2] += proposed_move[s.z]

                verified_move = [proposed_move[0], ...curr_player.pos]

                if (curr_player.pos[2] == curr_player.goalZ) {
                    winner = curr_player.id
                    await updateElo(supabaseClient, curr_player.id, other_player.id)
                    await writeMoveToDB(supabaseClient, game_id, data.moves, verified_move, winner, p1_time, p2_time, ingest_time)
                    return endGame(supabaseClient, game_id, 'game over');
                }
            }
        }
        // Check proposed fence move
        else {
            isValid = isValidFenceMove(gameSpace, proposed_move, p1, p2)
            verified_move = proposed_move.slice();
        }


        // Add players to board (for debug logging)
        [p1, p2].forEach((player: Player) => {
            const pos = player.pos
            gameSpace[pos[0]][pos[1]][pos[2]] = PLAYER
        })


        // see note on function definition
        // writeGameSpaceToConsole(gameSpace)

        // if all checks are passed, append this move to database record and increment move_num
        if (isValid) {
            await writeMoveToDB(supabaseClient, game_id, data.moves, verified_move, winner, p1_time, p2_time, ingest_time)
        }

        return new Response(JSON.stringify({ isValid }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.log(error)
        return new Response(JSON.stringify({ error }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})

async function deleteGameInvite(supabaseClient: any, game_id: string) {
    const { error } = await supabaseClient
        .from('game-invites')
        .delete()
        .eq('gid', game_id)

    console.log(error)
}

async function updateElo(supabaseClient: any, winner_id: string, loser_id: string) {
    const {data: {elo: winner_elo}, e1 } = await supabaseClient
        .from('users')
        .select('elo')
        .eq('id', winner_id)
        .single()

    const {data: {elo: loser_elo}, e2 } = await supabaseClient
        .from('users')
        .select('elo')
        .eq('id', loser_id)
        .single()

    console.log(e1)
    console.log(e2)

  const diff = loser_elo - winner_elo
  const ratio = diff / 400
  const intermediate = Math.pow(10, ratio) + 1
  const expected = 1 / (intermediate)
  const elo_amount = Math.ceil(20 * (1 - expected))

    const { d1, e3 } = await supabaseClient
        .from('users')
        .update({elo: winner_elo + elo_amount})
        .eq('id', winner_id)

    const { d2, e4 } = await supabaseClient
        .from('users')
        .update({elo: loser_elo - elo_amount})
        .eq('id', loser_id)

    console.log(e3)
    console.log(e4)

  console.log('winner new elo =', winner_elo + elo_amount)
}

async function writeMoveToDB(client: any, gid: string, moves: Move[], proposed_move: Move, winner: string | null, p1_time: Date, p2_time: Date, last_update: Date) {
    moves.push(proposed_move)

    const { data, error } = await client
        .from('games')
        .update({ move_num: moves.length,
                  moves: moves,
                  winner: winner,
                  p1_time: p1_time.toISOString(),
                  p2_time: p2_time.toISOString(),
                  last_update: moves.length >= 2 ? last_update.toISOString() : null
                })
        .eq('id', gid)

    if (error) {
        console.log(error)
        throw error
    }
    return data
}


// Check proposed fence move, make sure it's in bounds, is aligned to proper grid row, col, layer
// make sure path exists for both players post placement
export function isValidFenceMove(gameSpace: GameSpace, move: Move, p1: Player, p2: Player) {
    let isValid = true;
    isValid = spaceExistsForFence(gameSpace, move)
        && !fenceIntersects(gameSpace, move)
    if (isValid) {
        addFenceToGameSpace(gameSpace, move)
        isValid = pathExistsForPlayer(gameSpace, [0, ...p1.pos], p1.goalZ)
            && pathExistsForPlayer(gameSpace, [0, ...p2.pos], p2.goalZ)
    }
    return isValid
}

export function spaceExistsForFence(gameSpace: GameSpace, fence: Move) {
    // odd numbers on the grid can only be occupied by pawns, not fences
    if (fence[s.x] % 2 || fence[s.y] % 2 || fence[s.z] % 2) return false
    if (!inBounds(extents, fence)) return false

    // test if the full length of the fence is in bounds
    switch (fence[0]) {
        case MoveType.Vertical:
            if (
                fence[s.x] == 0 ||
                fence[s.x] == extents.right ||
                fence[s.y] >= extents.top - 2 ||
                fence[s.z] >= extents.far - 2
            ) {
                return false
            }
            break
        case MoveType.Flat:
            if (
                fence[s.x] >= extents.right - 2 ||
                fence[s.y] == 0 ||
                fence[s.y] == extents.top ||
                fence[s.z] >= extents.far - 2
            ) {
                return false
            }
            break
        case MoveType.Horizontal:
            if (
                fence[s.x] >= extents.right - 2 ||
                fence[s.y] >= extents.top - 2 ||
                fence[s.z] == 0 ||
                fence[s.z] == extents.far
            ) {
                return false
            }
            break
    }

    return true
}

export function fenceIntersects(gameSpace: GameSpace, fence: Move) {
    let intersects = false;
    if (fence[0] == MoveType.Flat) {
        [1, 2, 3].some((offset: number) => {
            if ([1, 2, 3].some((offsetPrime: number) => {
                let x = fence[s.x] + offset;
                let y = fence[s.y];
                let z = fence[s.z] + offsetPrime;

                let yAbove = fence[s.y] + 1;
                let yBelow = fence[s.y] - 1;

                let layerCurrFail = gameSpace[x][y][z] != VACANT;
                let layerAboveFail = !inBounds(extents, [0, x, yAbove, z]) || gameSpace[x][yAbove][z] == FENCE;
                let layerBelowFail = !inBounds(extents, [0, x, yBelow, z]) || gameSpace[x][yBelow][z] == FENCE;
                if (layerCurrFail || layerAboveFail && layerBelowFail) {
                    console.log("failing 0n: ", x, " ", y, " ", z, " Offsets are: ", offset, " ", offsetPrime)
                    intersects = true;
                    return true;
                }
            })) { return true; }
        });

    }
    else {
        [1, 2, 3].some((offset: number) => {
            if ([1, 2, 3].some((offsetPrime: number) => {
                let x = fence[s.x] + (fence[0] == MoveType.Horizontal ? offset : 0);
                let y = fence[s.y] + offsetPrime;
                let z = fence[s.z] + (fence[0] == MoveType.Vertical ? offset : 0);

                if (gameSpace[x][y][z] != VACANT) {
                    console.log("failing on: ", x, " ", y, " ", z, " Offsets are: ", offset, " ", offsetPrime)
                    intersects = true;
                    return true;
                }
            })) { return true; }
        });

    }

    return intersects;
}


export function pathExistsForPlayer(gameSpace: GameSpace, player_pos: Move, player_goalZ: number): boolean {
    let pathExists = true

    let gameSpaceCopy = JSON.parse(JSON.stringify(gameSpace));

    let stack = [player_pos];

    while (stack.length > 0) {
        let curr_pos = stack.pop()!;
        gameSpaceCopy[curr_pos[s.x]][curr_pos[s.y]][curr_pos[s.z]] = EXPLORED

        if (curr_pos[s.z] == player_goalZ) {
            return true;
        }

        stack.push(...getAdjacentCells(gameSpaceCopy, curr_pos));
    }

    pathExists = false;

    return pathExists;
}

export function getAdjacentCells(gameSpace: GameSpace, move: Move) {
    let adjacentCells: Move[] = [];

    let testDirection = (x_offset: number, y_offset: number, z_offset: number) => {
        if (validHeading(gameSpace, extents, move, x_offset, y_offset, z_offset)) {
            let new_move = move.slice() as Move
            new_move[s.x] += x_offset * 2
            new_move[s.y] += y_offset * 2
            new_move[s.z] += z_offset * 2
            adjacentCells.push(new_move);
        }
    }

    testDirection(-1, 0, 0);
    testDirection(1, 0, 0);
    testDirection(0, 1, 0);
    testDirection(0, -1, 0);
    testDirection(0, 0, 1);
    testDirection(0, 0, -1);

    return adjacentCells;
}

// deployed function will not have access to WriteAllSync
// so don't call this function unless you're developing locally
export function writeGameSpaceToConsole(gameSpace: GameSpace) {
    for (let z = extents.far; z >= 0; --z) {
        for (let y = 0; y <= extents.top; ++y) {
            for (let x = 0; x <= extents.right; ++x) {
                if (gameSpace[x][y][z] == PLAYER) {
                    writeAllSync(Deno.stdout, player)
                }
                else if (gameSpace[x][y][z] == FENCE) {
                    writeAllSync(Deno.stdout, fence)
                } else {
                    if (y % 2 || x % 2 || z % 2) {
                        writeAllSync(Deno.stdout, empty)
                    } else {
                        writeAllSync(Deno.stdout, no_fence)
                    }
                }
            }
            writeAllSync(Deno.stdout, tab)
        }
        writeAllSync(Deno.stdout, newline)
    }
}

async function endGame(supabaseClient: SupabaseClient<any, "public", any>, game_id: string, toast_msg: string){
    await deleteGameInvite(supabaseClient, game_id)
    return new Response(JSON.stringify({ res: toast_msg, isValid: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    })
}
