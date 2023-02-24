import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts'
import { writeGameSpaceToConsole, fenceIntersects, Move, MoveType, generateGameSpace, addFenceToGameSpace, spaceExistsForFence, extents, pathExistsForPlayer, Player, applyMovesToGameSpace } from './index.ts'

Deno.test('Move validation tests', () => {
    let gameSpace = generateGameSpace()

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

    let gameSpace = generateGameSpace()

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

    let gameSpace = generateGameSpace()

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

Deno.test("Player can't move through walls", () => {
    let ex_moves: Move[] = [
        [MoveType.Vertical, 8, 0, 0], //f1
        [MoveType.Vertical, 10, 0, 0], //f2
        [MoveType.Flat, 8, 4, 0], //f3
        [MoveType.Pawn, 9, 3, 15],
        [MoveType.Pawn, 9, 3, 3],
    ]


    const p1: Player = { id: 'player1', goalZ: 17, numFences: 15, pos: [9, 3, 1] };
    const p2: Player = { id: 'player2', goalZ: 1, numFences: 15, pos: [9, 3, 17] }

    let gameSpace = generateGameSpace()

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