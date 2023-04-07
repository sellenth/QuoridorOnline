export const VACANT = 0
export const FENCE = 1
export const PLAYER = 8
export const EXPLORED = 9

export type GameSpace = number[][][]

export type Extents = {
    near: number,
    far: number,

    left: number,
    right: number,

    bottom: number,
    top: number,
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

export function generateGameSpace(extents: Extents) {
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

export function calculateMoveOffets(move: Move, curr_player: Player): [number, number, number] {
    return [
        Math.sign(move[1]),
        Math.sign(move[2]),
        Math.sign(move[3])
    ]
}

export function validHeading(gameSpace: GameSpace, extents: Extents, move: Move, x_offset: number, y_offset: number, z_offset: number) {
    return (inBounds(extents, [0, move[s.x] + x_offset, move[s.y] + y_offset, move[s.z] + z_offset])
        && gameSpace[move[s.x] + x_offset][move[s.y] + y_offset][move[s.z] + z_offset] == VACANT

        && inBounds(extents, [0, move[s.x] + 2 * x_offset, move[s.y] + 2 * y_offset, move[s.z] + 2 * z_offset])
        && gameSpace[move[s.x] + 2 * x_offset][move[s.y] + 2 * y_offset][move[s.z] + 2 * z_offset] != EXPLORED)
}

export function inBounds(extents: Extents, [_, x, y, z]: Move) {
    return (
        x >= extents.left &&
        x <= extents.right &&
        y >= extents.bottom &&
        y <= extents.top &&
        z >= extents.near &&
        z <= extents.far
    )
}



// ensure move is one of the valid cursor positions
export function isValidPawnMove(gameSpace: GameSpace, extents: Extents, _3dMode: boolean, move: Move, curr_player: Player, other_player: Player) {
    let validCursors = generateValidCursors(gameSpace, extents, _3dMode, curr_player, other_player)

    for (let i = 0; i < validCursors.length; ++i) {
        let valid_move = validCursors[i]
        if (move[s.x] == valid_move[0] &&
            move[s.y] == valid_move[1] &&
            move[s.z] == valid_move[2]    ) {
            return true
        }
    }

    return false
}

export function generateValidCursors(gameSpace: GameSpace, extents: Extents, _3dMode: boolean, curr_player: Player, other_player: Player) {
    let validCursors: Pos[] = []

    let faceToFace = false
    let playerOffset: Pos = [
                        other_player.pos[0] - curr_player.pos[0],
                        other_player.pos[1] - curr_player.pos[1],
                        other_player.pos[2] - curr_player.pos[2]
                       ]

    let straightAcrossLeap: Pos = [
                                    playerOffset[0] * 2,
                                    playerOffset[1] * 2,
                                    playerOffset[2] * 2,
                                  ]

    generateCursorsAboutPoint(gameSpace, extents, _3dMode, curr_player.pos).forEach( (pos) => {
       if (curr_player.pos[0] + pos[0] != other_player.pos[0] ||
           curr_player.pos[1] + pos[1] != other_player.pos[1] ||
           curr_player.pos[2] + pos[2] != other_player.pos[2]) {
           validCursors.push(pos.slice() as Pos)
       } else {
           faceToFace = true
       }
    } )

    if (faceToFace) {

        // ultra scuffed way of adhering to validHeading reqs
        const offsetToCheck: Pos = [
                                    playerOffset[0] / 2 * 3,
                                    playerOffset[1] / 2 * 3,
                                    playerOffset[2] / 2 * 3,
                                   ]

        if (validHeading(gameSpace, extents, [MoveType.Pawn, ...curr_player.pos], ...offsetToCheck)) {
            validCursors.push(straightAcrossLeap)
        } else {
            generateCursorsAboutPoint(gameSpace, extents, _3dMode, other_player.pos).forEach((pos) => {
                if (other_player.pos[0] + pos[0] != curr_player.pos[0] ||
                    other_player.pos[1] + pos[1] != curr_player.pos[1] ||
                    other_player.pos[2] + pos[2] != curr_player.pos[2]) {
                    validCursors.push([
                        playerOffset[0] + pos[0],
                        playerOffset[1] + pos[1],
                        playerOffset[2] + pos[2],
                    ])
                }
            })

        }

    }


    return validCursors;
}

function generateCursorsAboutPoint(gameSpace: GameSpace, extents: Extents, _3dMode: boolean, pos: Pos) {
    let cursors: Pos[] = []
    // x motion
    let proposed_move: Pos = [-1, 0, 0]
    if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
        cursors.push([-2, 0, 0])
    }
    proposed_move = [+1, 0, 0]
    if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
        cursors.push([+2, 0, 0])
    }

    // z motion
    proposed_move = [0, 0, -1]
    if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
        cursors.push([0, 0, -2])
    }
    proposed_move = [0, 0, +1]
    if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
        cursors.push([0, 0, +2])
    }

    // y motion (should be disabled in 2d mode)
    if (_3dMode) {
        proposed_move = [0, -1, 0]
        if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
            cursors.push([0, -2, 0])
        }
        proposed_move = [0, +1, 0]
        if (validHeading(gameSpace, extents, [MoveType.Pawn, ...pos], ...proposed_move)) {
            cursors.push([0, +2, 0])
        }
    }

    return cursors
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
