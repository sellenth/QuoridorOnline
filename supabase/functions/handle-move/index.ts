// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { writeAllSync } from 'https://deno.land/std@0.177.0/streams/write_all.ts'

const fence = new TextEncoder().encode('F')
const no_fence = new TextEncoder().encode('0')
const player = new TextEncoder().encode('P')
const empty = new TextEncoder().encode(' ')
const newline = new TextEncoder().encode('\n')
const tab = new TextEncoder().encode('\t')

const VACANT = 0
const FENCE = 1
const PLAYER = 8
const EXPLORED = 9

export const extents = {
    near: 0,
    far: 18,

    left: 0,
    right: 18,

    bottom: 0,
    top: 6,
}

export enum s {
    x = 1,
    y,
    z,
}

export enum MoveType {
    Pawn,
    Horizontal,
    Vertical,
    Flat,
}

export type Player = { id: string, goalZ: number, numFences: number, pos: [number, number, number] };

export type Pos = [number, number, number]
export type Move = [MoveType, number, number, number]
export type GameSpace = number[][][]

serve(async (req: any) => {
    // required for invoking from browser
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

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

        const { game_id, proposed_move } = await req.json()

        // Get the game record
        const { data, error } = await supabaseClient
            .from('games')
            .select('*')
            .eq('id', game_id)
            .single()
        if (error) throw error

        // Check if this game is over
        if (data.winner != null) {
            return new Response(JSON.stringify({ res: `${data.winner} won!` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // if the move list length is even, that means it is player 2's turn
        const p2_move = !!(data.moves.length % 2)
        console.log(data.moves)
        console.log(data.moves.length)

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

        let gameSpace = generateGameSpace()
        const p1: Player = { id: data.p1_id, goalZ: p2_start_row, numFences: 15, pos: [p_start_col, p_start_layer, 1] };
        const p2: Player = { id: data.p2_id, goalZ: 1, numFences: 15, pos: [p_start_col, p_start_layer, p2_start_row] }

        applyMovesToGameSpace(gameSpace, data.moves, p1, p2)

        let isValid = true
        let winner = null
        let verified_move;

        // Check proposed player move
        if (proposed_move[0] == MoveType.Pawn) {
            const curr_player = p2_move ? p2 : p1;
            const other_player = p2_move ? p1 : p2;

            isValid = isValidPawnMove(gameSpace, proposed_move, curr_player)
            if (isValid) {
                let offsets = calculateMoveOffets(proposed_move, curr_player)
                curr_player.pos[0] += offsets[0] * 2
                curr_player.pos[1] += offsets[1] * 2
                curr_player.pos[2] += offsets[2] * 2

                verified_move = [proposed_move[0], ...curr_player.pos]

                if (curr_player.pos[2] == curr_player.goalZ) {
                    winner = curr_player.id
                    await updateElo(supabaseClient, curr_player, other_player)
                    await deleteGameInvite(supabaseClient, game_id)
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


        writeGameSpaceToConsole(gameSpace)

        // if all checks are passed, append this move to database record and increment move_num
        if (isValid) {
            await writeMoveToDB(supabaseClient, game_id, data.moves, verified_move, winner)
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

async function updateElo(supabaseClient: any, winner: Player, loser: Player) {
    const {data: {elo: winner_elo}, e1 } = await supabaseClient
        .from('users')
        .select('elo')
        .eq('id', winner.id)
        .single()

    const {data: {elo: loser_elo}, e2 } = await supabaseClient
        .from('users')
        .select('elo')
        .eq('id', loser.id)
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
        .eq('id', winner.id)

    const { d2, e4 } = await supabaseClient
        .from('users')
        .update({elo: loser_elo - elo_amount})
        .eq('id', loser.id)

    console.log(e3)
    console.log(e4)

  console.log('winner new elo =', winner_elo + elo_amount)
}

async function writeMoveToDB(client: any, gid: string, moves: Move[], proposed_move: Move, winner: string | null) {
    moves.push(proposed_move)

    const { data, error } = await client
        .from('games')
        .update({ move_num: moves.length, moves: moves, winner: winner })
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

function calculateMoveOffets(move: Move, curr_player: Player): [number, number, number] {
    return [
        Math.sign(move[1]),
        Math.sign(move[2]),
        Math.sign(move[3])
    ]
}

// Check proposed player move, ensure it only moves in one direction,
// 2 units, and doesn't go through a wall
export function isValidPawnMove(gameSpace: GameSpace, move: Move, curr_player: Player) {
    let isValid = true

    let offsets = calculateMoveOffets(move, curr_player)

    let num_axis_moved = 0
    offsets.forEach((offset) => {
        if (offset != 0) num_axis_moved++;
    })

    if (num_axis_moved != 1) {
        return false
    }

    isValid = isValid && validHeading(gameSpace, [MoveType.Pawn, ...curr_player.pos], ...offsets)
    return isValid
}

export function generateGameSpace() {
    let gameSpace: GameSpace = []
    for (let x = 0; x <= extents.right; ++x) {
        gameSpace.push([])
        for (let y = 0; y <= extents.top; ++y) {
            gameSpace[x].push([])
            for (let z = 0; z <= extents.far; ++z) {
                gameSpace[x][y].push(VACANT)
            }
        }
    }
    return gameSpace
}

export function spaceExistsForFence(gameSpace: GameSpace, fence: Move) {
    // odd numbers on the grid can only be occupied by pawns, not fences
    if (fence[s.x] % 2 || fence[s.y] % 2 || fence[s.z] % 2) return false
    if (!inBounds(fence)) return false

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
                let layerAboveFail = !inBounds([0, x, yAbove, z]) || gameSpace[x][yAbove][z] == FENCE;
                let layerBelowFail = !inBounds([0, x, yBelow, z]) || gameSpace[x][yBelow][z] == FENCE;
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

export function validHeading(gameSpace: GameSpace, move: Move, x_offset: number, y_offset: number, z_offset: number) {
    return (inBounds([0, move[s.x] + x_offset, move[s.y] + y_offset, move[s.z] + z_offset])
        && gameSpace[move[s.x] + x_offset][move[s.y] + y_offset][move[s.z] + z_offset] == VACANT

        && inBounds([0, move[s.x] + 2 * x_offset, move[s.y] + 2 * y_offset, move[s.z] + 2 * z_offset])
        && gameSpace[move[s.x] + 2 * x_offset][move[s.y] + 2 * y_offset][move[s.z] + 2 * z_offset] != EXPLORED)
}

export function getAdjacentCells(gameSpace: GameSpace, move: Move) {
    let adjacentCells: Move[] = [];

    let testDirection = (x_offset: number, y_offset: number, z_offset: number) => {
        if (validHeading(gameSpace, move, x_offset, y_offset, z_offset)) {
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


export function addFenceToGameSpace(gameSpace: GameSpace, fence: Move) {
    const orientation = fence[0]

    const offsets = [1, 2, 3]
    offsets.forEach((offset: number) => {
        offsets.forEach((offsetPrime: number) => {
            let x = fence[1]
            let y = fence[2]
            let z = fence[3]
            switch (orientation) {
                case 1: //horiz
                    x += offset
                    y += offsetPrime
                    break
                case 2: // vertical
                    y += offset
                    z += offsetPrime
                    break
                case 3: //flat
                    x += offset
                    z += offsetPrime
                    break
            }

            gameSpace[x][y][z] = FENCE
        })
    })
}

export function applyMovesToGameSpace(gameSpace: GameSpace, moves: Move[], p1: Player, p2: Player) {
    moves.forEach((move: Move, idx: number) => {
        const [move_type, x, y, z] = move
        const p2_move = !!(idx % 2)

        // pawn move
        if (move_type == 0) {
            if (p2_move) {
                p2.pos = [x, y, z]
            } else {
                p1.pos = [x, y, z]
            }
        }

        // fence move
        if (move_type != 0) {
            if (p2_move) {
                p2.numFences--
            } else {
                p1.numFences--
            }
            addFenceToGameSpace(gameSpace, move)
        }
    })
}

export function inBounds([_, x, y, z]: Move) {
    return (
        x >= extents.left &&
        x <= extents.right &&
        y >= extents.bottom &&
        y <= extents.top &&
        z >= extents.near &&
        z <= extents.far
    )
}

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
