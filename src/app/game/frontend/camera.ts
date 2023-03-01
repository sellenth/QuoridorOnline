import { GameLogic } from "./gameLogic"
import { Vec3 } from "../shared/types"
import { clamp } from "./utils"
import {crossProductVec3, subVec3, addVec3, scaleVec3, normalizeVec3, cos_d, sin_d, invertMat4} from "./math"

//let audio = new Audio("/static/jakesTrack.m4a");

export class Camera {
    frontVec: Vec3 = [0, 0, 1];
    rightVec: Vec3 = [1, 0, 0];
    upVec: Vec3    = [0, 1, 0];
    position: Vec3 = [6., 5., -5.];
    yaw = -89;
    pitch = 30;
    moveSpeed = 20;
    mouseSens = 0.1;
    spaceExtents: Vec3 = [20, 20, 20];
    keysDown = {
        a: false,
        w: false,
        s: false,
        d: false,
        space: false,
        ctrl: false
    };
    firstLook = true;

    constructor()
    {
        this.updateVectors();
    }

    SetExtents(extents: Vec3)
    {
        this.spaceExtents = extents
    }

    GetPosition()
    {
        return this.position;
    }

    GetFrontVec()
    {
        return this.frontVec;
    }

    GetYaw()
    {
        return this.yaw;
    }

    GetPitch()
    {
        return this.pitch;
    }

    Move(deltaTime: number)
    {
        let velocity = this.moveSpeed * deltaTime;
        if (this.keysDown.w)
        {
            this.position = subVec3(this.position, scaleVec3(this.frontVec, velocity));
        }
        if (this.keysDown.s) {
            this.position = addVec3(this.position, scaleVec3(this.frontVec, velocity));
        }
        if (this.keysDown.a) {
            this.position = subVec3(this.position, scaleVec3(this.rightVec, velocity));
        }
        if (this.keysDown.d) {
            this.position = addVec3(this.position, scaleVec3(this.rightVec, velocity));
        }
        if (this.keysDown.space) {
            this.position = addVec3(this.position, scaleVec3(this.upVec, velocity));
        }
        if (this.keysDown.ctrl) {
            this.position = subVec3(this.position, scaleVec3(this.upVec, velocity));
        }

        this.position.forEach((_, i, arr) => {
            const padding = 5.;

            arr[i] = clamp(arr[i], -padding, this.spaceExtents[i] + padding)
        })
    }

    updateVectors()
    {
        let front: Vec3 = [0, 0, 0];
        front[0] = cos_d(this.yaw) * cos_d(this.pitch);
        front[1] = sin_d(this.pitch);
        front[2] = sin_d(this.yaw) * cos_d(this.pitch);

        this.frontVec = normalizeVec3(front);
        this.rightVec = normalizeVec3(crossProductVec3( this.frontVec, [0, 1, 0] ));
        this.upVec = normalizeVec3(crossProductVec3( this.rightVec, this.frontVec ));

    }

    getCameraMatrix()
    {
        return [
            ...this.rightVec, 0,
            ...this.upVec,    0,
            ...this.frontVec, 0,
            ...this.position, 1
        ]
    }

    getViewMatrix()
    {
        return invertMat4(this.getCameraMatrix());
    }

    lookAt(target: Vec3, up: Vec3) {
        var zAxis = normalizeVec3(
            subVec3(this.position, target));
        var xAxis = normalizeVec3(crossProductVec3(up, zAxis));
        var yAxis = normalizeVec3(crossProductVec3(zAxis, xAxis));

        return invertMat4([
        ...xAxis,         0,
        ...yAxis,         0,
        ...zAxis,         0,
        ...this.position, 1,
        ]);
    }

    Look(xOffset: number, yOffset: number)
    {
        xOffset *= this.mouseSens;
        yOffset *= this.mouseSens;

        this.yaw -= xOffset;
        this.pitch += yOffset;

        if (this.pitch > 89)
            this.pitch = 89;
        if (this.pitch < -89)
            this.pitch = -89;

        this.updateVectors();
    }

    configureCameraListeners(canvas: HTMLCanvasElement, gameLogic: GameLogic)
    {
        canvas.addEventListener('keydown', e => {
            if (e.key == "w")
                this.keysDown.w = true;
            if (e.key == "a")
                this.keysDown.a = true;
            if (e.key == "s")
                this.keysDown.s = true;
            if (e.key == "d")
                this.keysDown.d = true;
            if (e.key == "ArrowRight")
                gameLogic.MoveCursorRight();
            if (e.key == "ArrowLeft")
                gameLogic.MoveCursorLeft();
            if (e.key == "ArrowUp")
                gameLogic.MoveCursorFront();
            if (e.key == "ArrowDown")
                gameLogic.MoveCursorBack();
            if (e.key == "q")
                gameLogic.MoveCursorDown();
            if (e.key == "e")
                gameLogic.MoveCursorUp();
            if (e.key == "Control")
                this.keysDown.ctrl = true;
            if (e.key == " ")
                this.keysDown.space = true;
            if (e.key == "Enter")
                gameLogic.commitMove();
            if (e.key == "c")
                gameLogic.switchCursorMode();
            if (e.key == "r")
                gameLogic.nextCursorOrientation();
        })

        canvas.addEventListener('keyup', e => {
            if (e.key == "w")
                this.keysDown.w = false;
            if (e.key == "a")
                this.keysDown.a = false;
            if (e.key == "s")
                this.keysDown.s = false;
            if (e.key == "d")
                this.keysDown.d = false;
            if (e.key == "Control")
                this.keysDown.ctrl = false;
            if (e.key == " ")
                this.keysDown.space = false;
        })

        canvas.addEventListener('click', (_) => {
            this.firstLook = true;
            if (this.firstLook == true)
            {
                //audio.play();
            }
            canvas.requestPointerLock = canvas.requestPointerLock;
            canvas.requestPointerLock();
        })

        canvas.addEventListener('mousemove', e => {
            if (document.pointerLockElement == canvas) {
                if (this.firstLook) {
                    this.firstLook = false;
                    this.Look(0, 0);
                }
                else {
                    this.Look(e.movementX, e.movementY);
                }
            }
        })
    }
}
