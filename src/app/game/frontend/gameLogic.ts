import { Player } from "./types"
import { addVec3 } from "./math";
import { Vec3, Cursor, ClientMessage, ID, Orientation, Player as NetworkPlayer, MessageType } from "../shared/types";
import { clamp } from "./utils";
import { Camera } from "./camera"

const UNINITIALIZED = "NA";

type Fence = Cursor

export class GameLogic {
    gridSizeXY: number = 18;
    gridLayers: number = 6;
    myId: ID = UNINITIALIZED;
    activePlayerId: ID = UNINITIALIZED;
    cameraRef: Camera | null = null

    cursor: Cursor = {
        pos: [2, 0, 0],
        orientation: Orientation.Vertical
    }
    cursorMode = "fence";
    players: Player[];
    fencePositions: Cursor[];

    notifyServer: (msg: [number, number, number, number]) => Promise<void>;

    constructor() {
        this.players = [];
        this.fencePositions = [];
        this.notifyServer = async () => { }
    }

    assignId(id: ID) {
        this.myId = id;
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
                    pos: [player.pos[1], player.pos[2], player.pos[0]],
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
        if (this.cursorMode == "pawn") {
            this.cursor.pos = v;

        }
        else if (this.cursorMode == "fence") {
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
        this.cursor.pos[0] = clamp(this.cursor.pos[0], 0, this.gridSizeXY - xModifier);
        this.cursor.pos[1] = clamp(this.cursor.pos[1], 0, this.gridLayers - yModifier);
        this.cursor.pos[2] = clamp(this.cursor.pos[2], 0, this.gridSizeXY - zModifier);
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

    switchCursorMode() {
        if (this.cursorMode == "fence") {
            this.cursorMode = "pawn";
            this.cursor.pos = [2, 0, 0];
        }
        else if (this.cursorMode == "pawn") {
            this.cursorMode = "fence";
            this.cursor.pos = addVec3([-1, -1, -1], this?.getActivePlayer()?.pos ?? [0., 0., 0.]);
            this.ClampCursorToBoard();
        }
    }

    nextCursorOrientation() {
        this.cursor.orientation++;
        if (this.cursor.orientation > Orientation.Flat) {
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
