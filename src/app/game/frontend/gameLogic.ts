import { Player } from "./types"
import { addVec3 } from "./math";
import { Vec3, Cursor, ID, Orientation } from "../shared/types";
import { clamp } from "./utils";
import { Camera } from "./camera"
import {  isValidPawnMove, applyMovesToGameSpace, Extents, FENCE, GameSpace, generateGameSpace, Player as NetworkPlayer, PLAYER, generateValidCursors, } from "../../../../supabase/functions/_shared/game-space";

const UNINITIALIZED = "NA";
type Fence = Cursor

export class GameLogic {
    myId: ID = UNINITIALIZED;
    activePlayerId: ID = UNINITIALIZED;
    cameraRef: Camera | null = null

    cursor: Cursor = {
        pos: [2, 0, 0],
        orientation: Orientation.Vertical
    }
    validCursorPositions: Vec3[] = []
    cursorIdx: number = 0
    cursorMode = "fence";
    players: Player[];
    fencePositions: Cursor[];
    gameSpace: GameSpace;
    extents: Extents;
    _3dMode: boolean = true

    notifyServer: (msg: [number, number, number, number]) => Promise<void>;

    constructor() {
        this.players = [];
        this.fencePositions = [];
        this.notifyServer = async () => { }
        this.extents = {
            near: 0,
            far: 18,

            left: 0,
            right: 18,

            bottom: 0,
            top: 6,
        }

        this.gameSpace = generateGameSpace(this.extents)
    }

    SetExtents(rows: number, cols: number, layers: number) {
        this.extents.far = rows;
        this.extents.right = cols;
        this.extents.top = layers;
    }

    createDemoScene() {
        this.players = []
        this.fencePositions = []
        this.players.push({
            id: "p1",
            pos: [5,1,5],
            color: [1, 1, 1],
            walls: 15
        })
        this.players.push({
            id: "p2",
            pos: [7,3,13],
            color: [1, 1, 1],
            walls: 15
        })

        this.fencePositions.push( { pos: [8, 0, 8], orientation: Orientation.Horizontal } )
        this.fencePositions.push( { pos: [6, 4, 6], orientation: Orientation.Flat } )
        this.fencePositions.push( { pos: [4, 0, 6], orientation: Orientation.Vertical } )
    }

    assignId(id: ID) {
        this.myId = id;
    }

    refreshGameSpace(data: any) {
        // set extents for this game space
        this.extents.far = data.rows * 2
        this.extents.right = data.cols * 2
        this.extents.top = data.layers * 2

        // calculate specific positions on the game board for player starts and ends
        const p2_start_row: number = data.rows * 2 - 1
        const p_start_col: number = data.cols % 2 ? data.cols : data.cols - 1
        const p_start_layer: number = data.layers % 2 ? data.layers : data.layers - 1

        this.gameSpace = generateGameSpace(this.extents)


        const fences: Fence[] = []
        const p1: NetworkPlayer = { id: data.p1_id,
                     goalZ: p2_start_row,
                     numFences: data.start_fences,
                     pos: [p_start_col, p_start_layer, 1] };

        const p2: NetworkPlayer = { id: data.p2_id,
                     goalZ: 1,
                     numFences: data.start_fences,
                     pos: [p_start_col, p_start_layer, p2_start_row] }

        applyMovesToGameSpace(this.gameSpace, data.moves, p1, p2)

        data.moves.forEach(([move_type, x, y, z]: number[]) => {
            // fence move
            if (move_type != 0) {
                fences.push({
                    pos: [x, y, z],
                    orientation: move_type
                })
            }
        })

        this.updateFences(fences)
        this.updatePlayers([p1, p2])

        console.log(this._3dMode)

        const p2_move = !!(data.moves.length % 2)
        if (p2_move) {
            this.validCursorPositions = generateValidCursors(this.gameSpace, this.extents, this._3dMode, p2, p1)
        } else {
            this.validCursorPositions = generateValidCursors(this.gameSpace, this.extents, this._3dMode, p1, p2)
        }
    }

    drawGameState() {
        let str = ""
        for (let z = this.extents.far; z >= 0; --z) {
            for (let y = 0; y <= this.extents.top; ++y) {
                for (let x = 0; x <= this.extents.right; ++x) {
                    if (this.gameSpace[x][y][z] == PLAYER) {
                        str += 'p'
                    }
                    else if (this.gameSpace[x][y][z] == FENCE) {
                        str += 'X'
                    } else {
                        if (y % 2 || x % 2 || z % 2) {
                            str += ' '
                        } else {
                            str += '0'
                        }
                    }
                }
                str += '\t'
            }
            str += '\n'
        }

        console.log(str)
    }

    updateFences(fences: Fence[]) {
        this.fencePositions.length = 0;
        fences.forEach((fence) => {
            this.fencePositions.push(
                {
                    pos: fence.pos,
                    orientation: fence.orientation
                }
            )
        })
    }

    updatePlayers(players: NetworkPlayer[]) {
        this.players.length = 0;
        players.forEach((player) => {
            this.players.push(
                {
                    id: player.id,
                    pos: player.pos,
                    color: [255, 155, 0],
                    walls: player.numFences,
                }
            )
        });
    }

    getActivePlayer(): Player | undefined {
        return this.players.find((player) => {
            return player.id == this.activePlayerId;
        });
    }

    IsMyTurn() {
        if (this.players.length == 0 || this.myId == UNINITIALIZED) {
            return false;
        }
        return this.getActivePlayer()?.id == this.myId;
    }

    setActivePlayer(id: ID) {
        this.activePlayerId = id;
    }

    MoveCursor(v: Vec3) {
        if (this.cursorMode == "fence") {
            this.cursor.pos = addVec3(this.cursor.pos, v);
            this.ClampCursorToBoard();
        }

    }

    ClampCursorToBoard() {
        let xModifier = 0;
        let yModifier = 0;
        let zModifier = 0;
        if (this.cursorMode == "fence") {
            switch (this.cursor.orientation) {
                case Orientation.Horizontal:
                    xModifier = 4;
                    yModifier = 4;
                    break;
                case Orientation.Vertical:
                    zModifier = 4;
                    yModifier = 4;
                    break
                case Orientation.Flat:
                    xModifier = 4;
                    zModifier = 4;
                    break;

            }
        }
        this.cursor.pos[0] = clamp(this.cursor.pos[0], 0, this.extents.right - xModifier);
        this.cursor.pos[1] = clamp(this.cursor.pos[1], 0, this.extents.top - yModifier);
        this.cursor.pos[2] = clamp(this.cursor.pos[2], 0, this.extents.far - zModifier);
    }

    GetNearestAxis(v: Vec3, sign: -1 | 1): Vec3 {
        let idx = 0
        let max = Number.MIN_SAFE_INTEGER
        for (let i = 0; i < 3; ++i) {
            if (Math.abs(v[i]) > max) {
                max = Math.abs(v[i])
                idx = i
            }
        }

        let ret: Vec3 = [0, 0, 0]
        ret[idx] = Math.sign(v[idx]) * 2 * sign
        return ret
    }

    MoveCursorUp() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.upVec, 1));
    }

    MoveCursorDown() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.upVec, -1));
    }

    MoveCursorFront() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.frontVec, -1));
    }

    MoveCursorBack() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.frontVec, 1));
    }

    MoveCursorLeft() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.rightVec, -1));
    }

    MoveCursorRight() {
        this.MoveCursor(this.GetNearestAxis(this.cameraRef!.rightVec, 1));
    }

    PreviousPlayerCursor() {
        if (this.cursorMode == "pawn") {
            this.cursorIdx--
            if (this.cursorIdx < 0) {
                this.cursorIdx = Math.max(0, this.validCursorPositions.length - 1)
            }
            this.cursor.pos = this.validCursorPositions[this.cursorIdx] as Vec3
        }
    }

    NextPlayerCursor() {
        if (this.cursorMode == "pawn") {
            this.cursorIdx++
            if (this.cursorIdx >= this.validCursorPositions.length) {
                this.cursorIdx = 0
            }
            this.cursor.pos = this.validCursorPositions[this.cursorIdx] as Vec3

        }
    }

    switchCursorMode() {
        if (this.cursorMode == "fence") {
            this.cursorMode = "pawn";
            this.NextPlayerCursor()
        }
        else if (this.cursorMode == "pawn") {
            this.cursorMode = "fence";
            this.cursor.pos = addVec3([-1, -1, -1], this?.getActivePlayer()?.pos ?? [0., 0., 0.]);
            this.ClampCursorToBoard();
        }
    }

    nextCursorOrientation() {
        this.cursor.orientation++;
        if (this.cursor.orientation > (this._3dMode ? Orientation.Flat : Orientation.Vertical)) {
            this.cursor.orientation = Orientation.Horizontal;
        }

        this.ClampCursorToBoard();
    }

    commitMove() {
        console.log(this.myId)
        if (this.myId != this.activePlayerId) {
            console.log("It isn't your turn, it is %d's turn", this.activePlayerId);
            return;
        }

        if (this.cursorMode == "pawn") {
            this.commitPawnMove();
        }
        if (this.cursorMode == "fence") {
            this.commitFenceMove();
        }
    }

    commitPawnMove() {
        let pos = this.cursor.pos;
        console.log('pawn', pos)
        this.notifyServer([0, ...pos])
    }


    commitFenceMove() {
        let pos = this.cursor.pos;
        console.log('fence', pos)
        let orientation = this.cursor.orientation;
        this.notifyServer([orientation, ...pos])
    }
}
