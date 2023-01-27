var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Camera_frontVec, _Camera_rightVec, _Camera_upVec, _Camera_position, _Camera_yaw, _Camera_pitch, _Camera_moveSpeed, _Camera_mouseSens, _Camera_spaceExtents;
import { crossProductVec3, subVec3, addVec3, scaleVec3, normalizeVec3, cos_d, sin_d, invertMat4 } from "./math";
export class Camera {
    constructor() {
        _Camera_frontVec.set(this, [0, 0, 1]);
        _Camera_rightVec.set(this, [1, 0, 0]);
        _Camera_upVec.set(this, [0, 1, 0]);
        _Camera_position.set(this, [5., .3, -5.]);
        _Camera_yaw.set(this, -89);
        _Camera_pitch.set(this, 0);
        _Camera_moveSpeed.set(this, 10);
        _Camera_mouseSens.set(this, 0.1);
        _Camera_spaceExtents.set(this, [10, 10, 10]);
        this.keysDown = {
            a: false,
            w: false,
            s: false,
            d: false,
            space: false,
            ctrl: false
        };
        this.firstLook = true;
        this.updateVectors();
    }
    SetExtents(extents) {
        __classPrivateFieldSet(this, _Camera_spaceExtents, extents, "f");
    }
    GetPosition() {
        return __classPrivateFieldGet(this, _Camera_position, "f");
    }
    GetFrontVec() {
        return __classPrivateFieldGet(this, _Camera_frontVec, "f");
    }
    GetYaw() {
        return __classPrivateFieldGet(this, _Camera_yaw, "f");
    }
    GetPitch() {
        return __classPrivateFieldGet(this, _Camera_pitch, "f");
    }
    Move(deltaTime) {
        let velocity = __classPrivateFieldGet(this, _Camera_moveSpeed, "f") * deltaTime;
        if (this.keysDown.w) {
            __classPrivateFieldSet(this, _Camera_position, subVec3(__classPrivateFieldGet(this, _Camera_position, "f"), scaleVec3(__classPrivateFieldGet(this, _Camera_frontVec, "f"), velocity)), "f");
        }
        if (this.keysDown.s) {
            __classPrivateFieldSet(this, _Camera_position, addVec3(__classPrivateFieldGet(this, _Camera_position, "f"), scaleVec3(__classPrivateFieldGet(this, _Camera_frontVec, "f"), velocity)), "f");
        }
        if (this.keysDown.a) {
            __classPrivateFieldSet(this, _Camera_position, subVec3(__classPrivateFieldGet(this, _Camera_position, "f"), scaleVec3(__classPrivateFieldGet(this, _Camera_rightVec, "f"), velocity)), "f");
        }
        if (this.keysDown.d) {
            __classPrivateFieldSet(this, _Camera_position, addVec3(__classPrivateFieldGet(this, _Camera_position, "f"), scaleVec3(__classPrivateFieldGet(this, _Camera_rightVec, "f"), velocity)), "f");
        }
        if (this.keysDown.space) {
            __classPrivateFieldSet(this, _Camera_position, addVec3(__classPrivateFieldGet(this, _Camera_position, "f"), [0, velocity, 0]), "f");
        }
        if (this.keysDown.ctrl) {
            __classPrivateFieldSet(this, _Camera_position, addVec3(__classPrivateFieldGet(this, _Camera_position, "f"), [0, -velocity, 0]), "f");
        }
        __classPrivateFieldGet(this, _Camera_position, "f").forEach((_, i, arr) => {
            const padding = 5.;
            if (arr[i] < 0 - padding)
                arr[i] = -padding;
            else if (arr[i] > __classPrivateFieldGet(this, _Camera_spaceExtents, "f")[i] + padding) {
                arr[i] = __classPrivateFieldGet(this, _Camera_spaceExtents, "f")[i] + padding;
            }
        });
    }
    updateVectors() {
        let front = [0, 0, 0];
        front[0] = cos_d(__classPrivateFieldGet(this, _Camera_yaw, "f")) * cos_d(__classPrivateFieldGet(this, _Camera_pitch, "f"));
        front[1] = sin_d(__classPrivateFieldGet(this, _Camera_pitch, "f"));
        front[2] = sin_d(__classPrivateFieldGet(this, _Camera_yaw, "f")) * cos_d(__classPrivateFieldGet(this, _Camera_pitch, "f"));
        __classPrivateFieldSet(this, _Camera_frontVec, normalizeVec3(front), "f");
        __classPrivateFieldSet(this, _Camera_rightVec, normalizeVec3(crossProductVec3(__classPrivateFieldGet(this, _Camera_frontVec, "f"), [0, 1, 0])), "f");
        __classPrivateFieldSet(this, _Camera_upVec, normalizeVec3(crossProductVec3(__classPrivateFieldGet(this, _Camera_rightVec, "f"), __classPrivateFieldGet(this, _Camera_frontVec, "f"))), "f");
    }
    getCameraMatrix() {
        return [
            ...__classPrivateFieldGet(this, _Camera_rightVec, "f"), 0,
            ...__classPrivateFieldGet(this, _Camera_upVec, "f"), 0,
            ...__classPrivateFieldGet(this, _Camera_frontVec, "f"), 0,
            ...__classPrivateFieldGet(this, _Camera_position, "f"), 1
        ];
    }
    getViewMatrix() {
        return invertMat4(this.getCameraMatrix());
    }
    Look(xOffset, yOffset) {
        xOffset *= __classPrivateFieldGet(this, _Camera_mouseSens, "f");
        yOffset *= __classPrivateFieldGet(this, _Camera_mouseSens, "f");
        __classPrivateFieldSet(this, _Camera_yaw, __classPrivateFieldGet(this, _Camera_yaw, "f") - xOffset, "f");
        __classPrivateFieldSet(this, _Camera_pitch, __classPrivateFieldGet(this, _Camera_pitch, "f") + yOffset, "f");
        if (__classPrivateFieldGet(this, _Camera_pitch, "f") > 89)
            __classPrivateFieldSet(this, _Camera_pitch, 89, "f");
        if (__classPrivateFieldGet(this, _Camera_pitch, "f") < -89)
            __classPrivateFieldSet(this, _Camera_pitch, -89, "f");
        this.updateVectors();
    }
    configureCameraListeners(canvas, gameLogic) {
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
        });
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
        });
        canvas.addEventListener('click', e => {
            this.firstLook = true;
            if (this.firstLook == true) {
                audio.play();
            }
            canvas.requestPointerLock = canvas.requestPointerLock;
            canvas.requestPointerLock();
        });
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
        });
    }
}
_Camera_frontVec = new WeakMap(), _Camera_rightVec = new WeakMap(), _Camera_upVec = new WeakMap(), _Camera_position = new WeakMap(), _Camera_yaw = new WeakMap(), _Camera_pitch = new WeakMap(), _Camera_moveSpeed = new WeakMap(), _Camera_mouseSens = new WeakMap(), _Camera_spaceExtents = new WeakMap();
//# sourceMappingURL=camera.js.map