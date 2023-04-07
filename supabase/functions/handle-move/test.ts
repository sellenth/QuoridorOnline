import { isValidPawnMove, addFenceToGameSpace, EXPLORED, Extents, FENCE, generateGameSpace, GameSpace, PLAYER, VACANT, applyMovesToGameSpace, MoveType, s, Move, Player  } from '../_shared/game-space.ts'
import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { writeGameSpaceToConsole, fenceIntersects, spaceExistsForFence, extents, pathExistsForPlayer } from './index.ts'

Deno.test('Move validation tests', () => {
    let gameSpace = generateGameSpace(extents)

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Horizontal, 0, 0, extents.near]),
        false,
        "Can't place horizontal fence on near edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Horizontal, 0, 0, extents.far]),
        false,
        "Can't place horizontal fence on far edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Horizontal, extents.right - 2, 0, 0]),
        false,
        "Can't place horizontal fence 2 from right edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Horizontal, 0, 0, extents.near + 2]),
        true,
        "CAN place horizontal fence 2 from near edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Vertical, extents.left, 0, 0]),
        false,
        "Can't place vertical fence on left edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Vertical, extents.right, 0, 0]),
        false,
        "Can't place vertical fence on right edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Vertical, extents.right - 2, 0, extents.far - 2]),
        false,
        "Can't place vertical fence 2 from far edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Vertical, extents.left + 2, 0, 0]),
        true,
        "CAN place vertical fence 2 from left edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Flat, 0, extents.bottom, 0]),
        false,
        "Can't place flat fence on bottom edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Flat, 0, extents.top, 0]),
        false,
        "Can't place flat fence on top edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Flat, extents.right - 2, extents.top - 2, 0]),
        false,
        "Can't place flat fence 2 from right edge"
    )

    assertEquals(
        spaceExistsForFence(gameSpace, [MoveType.Flat, 0, extents.bottom + 2, 0]),
        true,
        "CAN place flat fence two from bottom edge"
    )
})

Deno.test('Test fence intersections', () => {
    let ex_moves: Move[] = [
        [MoveType.Vertical, 8, 0, 0], //f1
        [MoveType.Vertical, 10, 0, 0], //f2
        [MoveType.Flat, 8, 4, 0], //f3
        [MoveType.Pawn, 9, 3, 15],
        [MoveType.Pawn, 9, 3, 3],
    ]


    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace(extents)

    applyMovesToGameSpace(gameSpace, ex_moves, p1, p2)


    assertEquals(
        fenceIntersects(gameSpace, [MoveType.Horizontal, 6, 0, 2]),
        true,
        "this fence should intersect f1"
    )

    assertEquals(
        fenceIntersects(gameSpace, [MoveType.Vertical, 10, 0, 0]),
        true,
        "this fence should intersect f2 and f3"
    )

    assertEquals(
        fenceIntersects(gameSpace, [MoveType.Flat, 8, 2, 0]),
        true,
        "this fence should intersect f1 and f2"
    )

    assertEquals(
        fenceIntersects(gameSpace, [MoveType.Flat, 8, 2, 6]),
        false,
        "this fence should not intersect anything"
    )
})

Deno.test("Test that applying moves updates player info", () => {
    let ex_moves: Move[] = [
        [MoveType.Vertical, 8, 0, 0], //f1
        [MoveType.Vertical, 10, 0, 0], //f2
        [MoveType.Flat, 8, 4, 0], //f3
        [MoveType.Pawn, 9, 3, 15],
        [MoveType.Pawn, 9, 3, 3],
    ]

    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace(extents)

    applyMovesToGameSpace(gameSpace, ex_moves, p1, p2)

    assertEquals(
        p2.pos[2],
        15,
        "p2 should be moved towards the center of the board"
    )

    assertEquals(
        p1.numFences,
        13,
        "p1 placed f1 and f3"
    )
})

Deno.test("Can't create fence that blocks path", () => {
    let ex_moves: Move[] = [
        [MoveType.Vertical, 8, 0, 0], //f1
        [MoveType.Vertical, 10, 0, 0], //f2
        [MoveType.Flat, 8, 4, 0], //f3
        [MoveType.Pawn, 9, 3, 15],
        [MoveType.Pawn, 9, 3, 3],
    ]


    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace(extents)

    applyMovesToGameSpace(gameSpace, ex_moves, p1, p2)

    addFenceToGameSpace(gameSpace, [MoveType.Horizontal, 6, 0, 4])

    assertEquals(
        pathExistsForPlayer(gameSpace, [MoveType.Pawn, ...p1.pos], p1.goalZ),
        false,
        "Can't block player 1 from reaching end"
    )

    assertEquals(
        pathExistsForPlayer(gameSpace, [MoveType.Pawn, ...p2.pos], p2.goalZ),
        true,
        "but player 2 still has a viable path"
    )
});

Deno.test("Verifying player movement", () => {
    const _3dMode = true
    const _2dMode = false

    let ex_moves: Move[] = [
        [MoveType.Vertical, 8, 0, 0], //f1
        [MoveType.Vertical, 10, 0, 0], //f2
        [MoveType.Flat, 8, 4, 0], //f3
        [MoveType.Pawn, 9, 3, 15],
        [MoveType.Pawn, 9, 3, 3],
    ]


    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace(extents)

    applyMovesToGameSpace(gameSpace, ex_moves, p1, p2)

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, -2, 0, 0], p1, p2),
        false,
        "Can't move through fence (f1)"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, 0], p1, p2),
        false,
        "Can't have zero unit move"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, -2], p1, p2),
        true,
        "CAN move backwards into empty space"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, -2, 0], p1, p2),
        true,
        "when in 3d mode, allow moving to other layers"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _2dMode, [MoveType.Pawn, 0, -2, 0], p1, p2),
        false,
        "when not in 3d mode, disallow moving to other layers"
    )

    p1.pos = [9, 3, 1];
    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, -2], p1, p2),
        false,
        "can't move out of bounds"
    )

});

Deno.test("Verifying leap frog mechanic", () => {
    const _3dMode = true
    const _2dMode = false


    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace(extents)

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, 4], p1, p2),
        false,
        "can't leap frog unless face to face"
    )

    // this brings p2 to be face to face with p1
    p2.pos = [9, 3, 3]

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, 4], p1, p2),
        true,
        "can leap frog adjacent player"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, -2, 2], p1, p2),
        false,
        "alternate leap frogs are blocked if direct leap is possible"
    )

    // place fence behind p2
    addFenceToGameSpace(gameSpace, [1, 8, 0, 4] )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, 0, 4], p1, p2),
        false,
        "can't leap frog through fence"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _3dMode, [MoveType.Pawn, 0, -2, 2], p1, p2),
        true,
        "alternate leap frogs are allowed if direct leap not possible"
    )

    assertEquals(
        isValidPawnMove(gameSpace, extents, _2dMode, [MoveType.Pawn, 0, -2, 2], p1, p2),
        false,
        "can't leap frog down when in _2dMode"
    )

})