// @ts-nocheck

import { vss, vsPlayer } from "./vs";
import { fsFence, fsPlayer, fsCamera, fsGrid} from "./fs";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils"
import { identity, translate, projection, addVec3, rotationYZ, rotationXZ, scale, degreesToRadians, subVec3, q_projection, rotationXY } from "./math"
import { Camera } from "./camera";
import { GameLogic } from "./gameLogic";
import {
    ClientMessage, ID, MessageType, Orientation,
    Player, ServerPayload, Mat4, NetworkCamera
} from "../shared/types"
import { toast } from 'react-tiny-toast';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs'

const szFLOAT = 4;

type VisualUnit =
    {
        name: string
        program: WebGLProgram;
        VAO: WebGLVertexArrayObject;
        render: (projMat: Mat4, viewMat: Mat4) => void;
    }

class GameStatusHandler {
    gameInfoElement: HTMLElement;
    p1FencesElement: Node;
    p2FencesElement: Node;
    p1TimeElement: Node;
    p2TimeElement: Node;
    turnIndicatorElement: Node;
    gameCanvas: Node;
    intervalID: number = 0;
    notify_game_over = () => {}
    //GameOverModal: Node;

    constructor() {}

    Update( my_id,
            active_player_id,
            p1_id, p1_username,
            _p2_id, p2_username,
            p1_num_fences, p2_num_fences,
            p1_time, p2_time, last_update) {

        this.UpdateFences(true,  p1_username, p1_num_fences)
        this.UpdateFences(false, p2_username, p2_num_fences)

        if (this.p1TimeElement && this.p2TimeElement) {
            this.UpdateTimer(true, p1_time);
            this.UpdateTimer(false, p2_time);

            if (last_update != null) {
                this.UpdateTimerOnInterval(active_player_id == p1_id, p1_time, p2_time, last_update);
            }
        }

        this.UpdateTurnIndicator(my_id, active_player_id);

    }

    CreateTimerString(d: Date) {
        return        String(d.getUTCHours() + (24 * (d.getUTCDate() - 1))).padStart(2, '0')
                    + ':'
                    + String(d.getUTCMinutes()).padStart(2, '0')
                    + ':'
                    + String(d.getUTCSeconds()).padStart(2, '0');
    }

    UpdateTimer(p1_turn: bool, time) {
        //indicatorElement.classList.add( green ? "text-theme-500" : "text-theme-red")
        const indicatorElement = p1_turn ? this.p1TimeElement : this.p2TimeElement;
        let d = new Date(time);

        if (d.getUTCFullYear() < 1337) {
            indicatorElement.textContent = '00:00:00'
        } else {
            indicatorElement.textContent = this.CreateTimerString(d);
        }
    }

    UpdateTimerOnInterval(p1_turn, p1_time, p2_time, last_update) {
        clearInterval(this.intervalID);
        const indicatorElement = p1_turn ? this.p1TimeElement : this.p2TimeElement;
        let time = p1_turn ? p1_time : p2_time;

        this.intervalID = setInterval( () => {
            let inter = ( new Date().getTime() - new Date(last_update).getTime());
            let d = new Date( new Date(time).getTime() - inter);

            if (d.getUTCFullYear() < 1337) {
                indicatorElement.textContent = '00:00:00'
                this.notify_game_over();
                console.log('notify server of game over')
                clearInterval(this.intervalID);
            } else {
                indicatorElement.textContent = this.CreateTimerString(d);
            }
        }, 1000 );
    }

    UpdateFences(p1_turn: bool, username, fences) {
        const indicatorElement = p1_turn ? this.p1FencesElement : this.p2FencesElement;

        if (this.gameInfoElement) {
            indicatorElement.textContent = `${username} - ${fences}`;
            indicatorElement.classList.add( p1_turn ? "text-theme-500" : "text-theme-red")
        }
    }

    UpdateTurnIndicator(myID: ID, activePlayerId: ID) {
        let who = myID == activePlayerId ? "your" : "the other player's";
        if (this.gameInfoElement) {
            this.turnIndicatorElement.textContent = `It's ${who} turn.`
        }

        if (this.gameCanvas) {
            if (myID == activePlayerId) {
                this.gameCanvas.classList.add("grab-focus");
            } else {
                this.gameCanvas.classList.remove("grab-focus");
            }
        }
    }

    SetGameInfoElement(el: HTMLElement) {
        this.gameInfoElement = el
        this.p1FencesElement = document.querySelector("#p1Fences")!;
        this.p2FencesElement = document.querySelector("#p2Fences")!;
        this.p1TimeElement = document.querySelector("#p1Time")!;
        this.p2TimeElement = document.querySelector("#p2Time")!;
        this.turnIndicatorElement = document.querySelector("#turnIndicator")!;
        this.gameCanvas = document.querySelector("#c")!;

        //this.gameCanvas.style = "display: none";
    }

    SetGameWon(username) {
        if (this.gameInfoElement) {
            const msg = `${username} won!`;
            this.turnIndicatorElement.textContent = msg
            toast.show(msg, { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-200 border border-gray-200", uniqueCode: 'game-over' })
            clearInterval(this.intervalID);
        }
    }
}

class FrameTiming {
    then: number;
    deltaTime: number;
    fps: number;
    elapsed: number;
    counterElement: HTMLElement;

    constructor() {
        this.then = new Date().getTime() * .001;
        this.elapsed = 0.;
        this.deltaTime = 0;
        this.fps = 0;
    }

    tick() {
        let now = new Date().getTime() * .001;
        this.deltaTime = now - this.then;
        this.elapsed += this.deltaTime;
        this.then = now;
        this.fps = 1 / this.deltaTime;
        if (this.counterElement) {
            this.counterElement.textContent = this.fps.toFixed();
        }
    }
}

interface DBClient {
    from: () => any,
    select: () => any,
    eq: () => any,
    single: () => any,
    functions: () => any,
    invoke: () => any
}

export default class Engine {
    canvas: HTMLCanvasElement
    gameLogic: GameLogic;
    gl: WebGL2RenderingContext;
    sceneObjects: VisualUnit[] = [];
    camera: Camera = new Camera();
    networkedCameras: Record<string, NetworkCamera>
    frameTiming: FrameTiming;
    gameStatusHandler: GameStatusHandler;
    render = true;
    fpsCounterElement: HTMLDivElement | null;
    gameInfoElement: HTMLDivElement | null;
    dbClient: DBClient | null;
    demoMode: boolean;
    firstTick: boolean = true;
    p1_username: string = 'p1';
    p2_username: string = 'p2';

    constructor() {
        this.canvas = document.querySelector("#c")!;
        this.gameInfoElement = document.querySelector("#gameInfo")!;
        this.gameLogic = new GameLogic();
        this.gameLogic.players = []
        this.gameLogic.cameraRef = this.camera
        this.demoMode = false;

        let gl_ctx = this.canvas.getContext("webgl2", { alpha: false });

        if (!gl_ctx) {
            alert("You need a webGL compatible browser")
            return;
        }

        this.gl = gl_ctx;

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.camera.configureCameraListeners(this.canvas, this.gameLogic);
        this.camera.SetExtents([this.gameLogic.extents.right,
                                this.gameLogic.extents.top,
                                this.gameLogic.extents.far]);

        this.networkedCameras = [];

        this.configurePrograms();

        this.frameTiming = new FrameTiming();
        this.gameStatusHandler = new GameStatusHandler();

    }

    registerDbClient(dbClient: SupabaseClient, gid: string) {
        this.dbClient = dbClient;
        this.gameLogic.notifyServer = async (move: [number, number, number, number], msg?: string) => {
            const { data, error } = await this.dbClient.functions.invoke('handle-move', {
                body: { proposed_move: move, game_id: gid, msg: msg }
            })
            if (error) {
                console.error(error)
            } else {
                console.log(data)
                if (!data.isValid) {
                    toast.show("The move was declined", { timeout: 3000, position: "bottom-center", className: "text-gray-200 bg-theme-red border border-gray-200" })
                }
            }
        }
        this.gameStatusHandler.notify_game_over = async () => {
            await this.dbClient.functions.invoke('handle-move', {
                body: { proposed_move: 'time expired', game_id: gid }
            })
        }
    }

    setDemoMode(b: boolean) {
        this.demoMode = b
    }

    setFpsCounterElement(el: HTMLDivElement) {
        this.frameTiming.counterElement = el
    }

    setGameInfoElement(el: HTMLDivElement) {
        this.gameStatusHandler.SetGameInfoElement(el)
    }

    async networkTick(game_id: string) {
        // fetch game state
        const { data } = await this.dbClient
            .from('games')
            .select('*, p1:p1_id(id, username), p2:p2_id(id, username)')
            .eq('id', game_id)
            .single()

        this.p1_username = data.p1.username
        this.p2_username = data.p2.username
        this.IngestGameState(data)
        this.firstTick = false;
    }

    async networkTick_payload(data: any) {
        data.p1 = { id: data.p1_id, username: this.p1_username }
        data.p2 = { id: data.p2_id, username: this.p2_username }
        this.IngestGameState(data)
        this.firstTick = false;
    }

    UpdateGridProgram() {
        let gridSceneObjectIdx = this.sceneObjects.findIndex( (vUnit) => {
            return vUnit.name == "grid"
        } )

        this.sceneObjects[gridSceneObjectIdx] = this.createGridProgram()

    }

    PackageCameraAsNetPayload() {
        return {
            position: this.camera.GetPosition(),
            pitch: this.camera.GetPitch(),
            yaw: this.camera.GetYaw(),
        }
    }

    IngestGameState(data) {
        let rows = data.rows * 2
        let cols = data.cols * 2
        let layers = data.layers * 2

        // set extents of game space
        this.camera.SetExtents([cols, layers, rows])
        this.gameLogic.SetExtents(rows, cols, layers)

        // active player
        this.gameLogic.setActivePlayer(
            (data.moves?.length % 2
                ? data.p2_id
                : data.p1_id) ?? data.p1_id);

        // rough design choices :/
        this.gameLogic._3dMode = data.layers > 2
        this.camera._3dMode = data.layers > 2

        // update engine w/ new game state
        this.gameLogic.refreshGameSpace(data)

        // update the fence counter and turn indicator
        const p1 = this.gameLogic.players[0]
        const p2 = this.gameLogic.players[1]
        this.gameStatusHandler.Update(this.gameLogic.myId,
                                      this.gameLogic.activePlayerId,
                                      data.p1.id, data.p1.username,
                                      data.p2.id, data.p2.username,
                                      p1.fences, p2.fences,
                                      data.p1_time, data.p2_time, data.last_update
                                     )

        if (data.winner == p1.id) {
           this.gameStatusHandler.SetGameWon(data.p1.username)
            this.gameLogic.gameOver = true
        } else if (data.winner == p2.id) {
           this.gameStatusHandler.SetGameWon(data.p2.username)
            this.gameLogic.gameOver = true
        }

        if (this.firstTick) {
            this.UpdateGridProgram()
        }

    }


    updateNetworkedCameras(payload) {
        let [id, camera] = payload
        this.networkedCameras[id] = camera;
    }

    async startRenderLoop() {
        const gl = this.gl;

        if (!gl) {
            return
        }
        let canvas = gl.canvas as HTMLCanvasElement

        while (this.render) {
            this.frameTiming.tick()

            resizeCanvasToDisplaySize(canvas, 1);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            //BG_COLOR_HERE
            gl.clearColor(0.12, 0.13, 0.14, 0.);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Update camera position
            if (this.demoMode){
                // move around a predetermined circle
                this.camera.position[0] = Math.cos(this.frameTiming.elapsed / 7) * 8 + 9
                this.camera.position[2] = Math.sin(this.frameTiming.elapsed / 7) * 8 + 9
            } else {
                // move based on keyboard input
                this.camera.Move(this.frameTiming.deltaTime);
            }

            // Calculate program independent matrices
            let projMat = this.gameLogic._3dMode ?
                projection(3.14 / 2, canvas.clientWidth / canvas.clientHeight, 0.1, 50)
                :
                q_projection(this.gameLogic.extents);

            let viewMat;

            if (this.demoMode) {
                // get camera such that it is always facing a center point
                viewMat = this.camera.lookAt( [9, 0, 9], [0, 1, 0]);
            } else if (!this.gameLogic._3dMode) {
                viewMat = this.camera.topDown(this.gameLogic.extents)
            } else {
                // get camera based on vectors updated by mouse movement
                viewMat = this.camera.getViewMatrix()
            }

            this.sceneObjects.forEach(so => {
                if (so.name != "camera" || this.gameLogic._3dMode) {
                    so.render(projMat, viewMat);
                }
            });

            await sleep(Math.max(0, 32 - this.frameTiming.deltaTime));
        }

    }

    configurePrograms() {
        this.sceneObjects = [];
        this.sceneObjects.push(this.createPlayerProgram());
        this.sceneObjects.push(this.createCameraProgram());
        this.sceneObjects.push(this.createFenceProgram());
        this.sceneObjects.push(this.createGridProgram());
    }

    createGridProgram() {
        const gl = this.gl!;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsGrid);

        if (!vs || !fs) {
            return
        }


        let gridProgram = createProgram(gl, vs, fs);

        if (!gridProgram) {
            return
        }
        let positionAttribLocation = gl.getAttribLocation(gridProgram, "a_position");

        let gridVAO = gl.createVertexArray();
        gl.bindVertexArray(gridVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let gridData = [];

        // Create horizontal lines
        for (let a = 0; a <= this.gameLogic.extents.far; a += 2) {
            for (let b = 0; b <= this.gameLogic.extents.top; b += 2) {
                gridData.push(0, b, a,
                    this.gameLogic.extents.right, b, a);
            }
        }

        // Create depth lines
        for (let a = 0; a <= this.gameLogic.extents.right; a += 2) {
            for (let b = 0; b <= this.gameLogic.extents.top; b += 2) {
                gridData.push(a, b, 0,
                    a, b, this.gameLogic.extents.far);
            }
        }

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridData), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionAttribLocation);

        // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
        gl.vertexAttribPointer(positionAttribLocation, // vertex attribute to modify
            3, // how many elements per attribute
            gl.FLOAT, // type of individual element
            false, //normalize
            3 * szFLOAT, //stride
            0 //offset from start of buffer
        );

        return {
            name: "grid",
            program: gridProgram,
            VAO: gridVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(gridProgram!);
                gl.bindVertexArray(gridVAO);

                let camPosLoc = gl.getUniformLocation(gridProgram!, "camPos");
                gl.uniform3fv(camPosLoc, this.camera.GetPosition());

                let projLoc = gl.getUniformLocation(gridProgram!, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(gridProgram!, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                let _3dModeLoc = gl.getUniformLocation(gridProgram!, "_3dMode");
                gl.uniform1f(_3dModeLoc, this.gameLogic._3dMode);

                let timeLoc = gl.getUniformLocation(gridProgram!, "u_time");
                gl.uniform1f(timeLoc, this.frameTiming.elapsed);

                let rowLoc = gl.getUniformLocation(gridProgram!, "u_numRows");
                gl.uniform1f(rowLoc, this.gameLogic.extents.far);

                let colLoc = gl.getUniformLocation(gridProgram!, "u_numCols");
                gl.uniform1f(colLoc, this.gameLogic.extents.right);

                let modelMat = identity();
                let modelLoc = gl.getUniformLocation(gridProgram!, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.drawArrays(gl.LINES, 0, gridData.length / 3);
            }
        };
    }

    createPlayerProgram() {
        const gl = this.gl!;

        let vs = createShader(gl, gl.VERTEX_SHADER, vsPlayer);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsPlayer);

        if (!vs || !fs) {
            return
        }

        let playerProgram = createProgram(gl, vs, fs);

        if (!playerProgram) {
            return
        }
        let playerPosAttrib = gl.getAttribLocation(playerProgram, "a_position");

        let playerVAO = gl.createVertexArray();
        gl.bindVertexArray(playerVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let cubeData = [
            0.80, 0.00, 0.80,
            0.80, 0.00, 1.20,
            1.20, 0.00, 1.20,
            1.20, 0.00, 0.80,

            0.80, 1.20, 0.80,
            0.80, 1.20, 1.20,
            1.20, 1.20, 1.20,
            1.20, 1.20, 0.80,

            0.50, 1.20, 0.50, // 8
            0.50, 1.20, 1.50,
            1.50, 1.20, 1.50,
            1.50, 1.20, 0.50,

            0.80, 1.90, 0.80,
            0.80, 1.90, 1.20,
            1.20, 1.90, 1.20,
            1.20, 1.90, 0.80,

            0.50, 0.0, 0.50, // 16
            0.50, 0.0, 1.50,
            1.50, 0.0, 1.50,
            1.50, 0.0, 0.50,

            0.80, 1.20, 0.80,
            0.80, 1.20, 1.20,
            1.20, 1.20, 1.20,
            1.20, 1.20, 0.80,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);

        let elBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);
        let elements = [
            0, 1, 2,
            0, 2, 3,

            0, 1, 5,
            0, 4, 5,

            1, 2, 6,
            1, 5, 6,

            2, 3, 6,
            3, 6, 7,

            0, 3, 7,
            0, 4, 7,

            8, 9, 10,
            8, 10, 11,

            8, 9, 12,
            12, 13, 9,

            9, 10, 13,
            13, 14, 10,

            10, 11, 14,
            14, 15, 11,

            8, 11, 15,
            8, 12, 15,

            12, 13, 14,
            12, 14, 15,

            16, 17, 18,
            16, 18, 19,

            20, 21, 22,
            20, 22, 23,

            16, 20, 21,
            16, 17, 21,

            17, 21, 22,
            17, 18, 22,

            18, 22, 23,
            18, 19, 23,

            16, 23, 20,
            16, 19, 23

        ]
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);


        gl.enableVertexAttribArray(playerPosAttrib);

        // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
        gl.vertexAttribPointer(playerPosAttrib, // vertex attribute to modify
            3, // how many elements per attribute
            gl.FLOAT, // type of individual element
            false, //normalize
            3 * szFLOAT, //stride
            0 //offset from start of buffer
        );

        return {
            name: "player",
            program: playerProgram,
            VAO: playerVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(playerProgram!);
                gl.bindVertexArray(playerVAO);

                let projLoc = gl.getUniformLocation(playerProgram!, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(playerProgram!, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                let timeLoc = gl.getUniformLocation(playerProgram!, "u_time");


                this.gameLogic.players.forEach((player, idx) => {
                    let modelMat = translate(...player.pos, identity());
                    modelMat = scale(0.8, 0.8, 0.8, modelMat);
                    modelMat = translate(-1, -1, -1, modelMat);

                    gl.uniform1f(timeLoc, this.frameTiming.elapsed + idx);

                    let colorLoc = gl.getUniformLocation(playerProgram!, "color");
                    gl.uniform3fv(colorLoc, player.color);

                    let modelLoc = gl.getUniformLocation(playerProgram!, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.drawElements(gl.TRIANGLES, elements.length, gl.UNSIGNED_SHORT, 0);
                })

                if (this.gameLogic.IsMyTurn() && this.gameLogic.cursorMode == "pawn") {
                    let modelMat = translate(...(this.gameLogic.getActivePlayer()?.pos ?? [0, 0, 0]), identity());
                    modelMat = translate(...this.gameLogic.pawnCursor.pos, modelMat);
                    modelMat = scale(0.2, 0.2, 0.2, modelMat);
                    modelMat = translate(-1, -1, -1, modelMat);

                    let colorLoc = gl.getUniformLocation(playerProgram!, "color");
                    gl.uniform3fv(colorLoc, this.gameLogic.getActivePlayer()?.color ?? [0, 0, 0]);

                    let modelLoc = gl.getUniformLocation(playerProgram!, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.drawElements(gl.TRIANGLES, elements.length, gl.UNSIGNED_SHORT, 0);
                }
            }
        };
    }

    createCameraProgram() {
        const gl = this.gl!;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsCamera);
        if (!vs || !fs) {
            return
        }

        let cameraProgram = createProgram(gl, vs, fs);
        if (!cameraProgram) {
            return
        }

        let cameraPosAttrib = gl.getAttribLocation(cameraProgram, "a_position");

        let cameraVAO = gl.createVertexArray();
        gl.bindVertexArray(cameraVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let cameraVertices = [
            .3, .3, 0,
            .7, .3, 0,
            .7, .7, 0,
            .3, .7, 0,

            .3, .3, .6,
            .7, .3, .6,
            .7, .7, .6,
            .3, .7, .6,

            .5, .5, .5, //8
            .3, .3, .9, //9
            .3, .7, .9, //10
            .7, .3, .9, //11
            .7, .7, .9, //12
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cameraVertices), gl.STATIC_DRAW);

        let elBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);
        let elements = [
            0, 1, 2,
            0, 2, 3,

            4, 5, 6,
            4, 6, 7,

            0, 3, 4,
            3, 4, 7,

            1, 5, 6,
            1, 2, 6,

            0, 1, 4,
            1, 4, 5,

            2, 3, 6,
            3, 6, 7,

            8, 9, 10,
            8, 10, 11,

            8, 11, 12,
            8, 9, 12,

            9, 10, 11,
            10, 11, 12
        ];
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);


        gl.enableVertexAttribArray(cameraPosAttrib);

        // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
        gl.vertexAttribPointer(cameraPosAttrib, // vertex attribute to modify
            3, // how many elements per attribute
            gl.FLOAT, // type of individual element
            false, //normalize
            3 * szFLOAT, //stride
            0 //offset from start of buffer
        );

        return {
            name: "camera",
            program: cameraProgram,
            VAO: cameraVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(cameraProgram!);
                gl.bindVertexArray(cameraVAO);

                let projLoc = gl.getUniformLocation(cameraProgram!, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(cameraProgram!, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                Object.values(this.networkedCameras).forEach((camera) => {
                    let modelMat = translate(...camera.position, identity());
                    modelMat = rotationXZ(degreesToRadians(camera.yaw + 90), modelMat);
                    modelMat = rotationYZ(degreesToRadians(camera.pitch * -1), modelMat);
                    modelMat = translate(-.5, -.5, 0, modelMat);

                    let colorLoc = gl.getUniformLocation(cameraProgram!, "color");
                    gl.uniform3fv(colorLoc, [.2, .4, .6]);

                    let modelLoc = gl.getUniformLocation(cameraProgram!, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.drawElements(gl.TRIANGLES, elements.length, gl.UNSIGNED_SHORT, 0);
                })

            }
        };
    }

    createFenceProgram() {
        const gl = this.gl!;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsFence);
        if (!vs || !fs) {
            return
        }

        let fenceProgram = createProgram(gl, vs, fs);
        if (!fenceProgram) {
            return
        }
        let fencePosAttrib = gl.getAttribLocation(fenceProgram, "a_position");

        let fenceVAO = gl.createVertexArray();
        gl.bindVertexArray(fenceVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let farExtent = 3.8;
        let nearExtent = .2;

        let fenceData = [
            nearExtent, nearExtent, -.1,
            farExtent, nearExtent, -.1,
            farExtent, farExtent, -.1,
            nearExtent, farExtent, -.1,

            nearExtent, nearExtent, .1,
            farExtent, nearExtent, .1,
            farExtent, farExtent, .1,
            nearExtent, farExtent, .1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fenceData), gl.STATIC_DRAW);

        let elBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elBuff);
        let elements = [
            0, 1, 2,
            0, 2, 3,

            4, 5, 6,
            4, 6, 7,

            0, 3, 4,
            3, 4, 7,

            1, 5, 6,
            1, 2, 6,

            0, 1, 4,
            1, 4, 5,

            2, 3, 6,
            3, 6, 7
        ]
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(fencePosAttrib);

        // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
        gl.vertexAttribPointer(fencePosAttrib, // vertex attribute to modify
            3, // how many elements per attribute
            gl.FLOAT, // type of individual element
            false, //normalize
            3 * szFLOAT, //stride
            0 //offset from start of buffer
        );

        return {
            name: "fence",
            program: fenceProgram,
            VAO: fenceVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                // Draw Fences
                gl.useProgram(fenceProgram!);
                gl.bindVertexArray(fenceVAO);

                let projLoc = gl.getUniformLocation(fenceProgram!, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(fenceProgram!, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                let colorLoc = gl.getUniformLocation(fenceProgram!, "color");

                let timeLoc = gl.getUniformLocation(fenceProgram!, "u_time");
                gl.uniform1f(timeLoc, this.frameTiming.elapsed);

                this.gameLogic.fencePositions.forEach(fence => {
                    let modelMat = translate(...fence.pos, identity());
                    if (fence.orientation == Orientation.Flat)
                        modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                    if (fence.orientation == Orientation.Vertical)
                        modelMat = rotationXZ(Math.PI / 2, modelMat);

                    let modelLoc = gl.getUniformLocation(fenceProgram!, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.uniform3fv(colorLoc, [.0, 0., 0.]);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                })

                if (this.gameLogic.IsMyTurn() && this.gameLogic.cursorMode == "fence") {
                    let modelMat = translate(...this.gameLogic.fenceCursor.pos, identity());
                    switch (this.gameLogic.fenceCursor.orientation) {
                        case Orientation.Flat:
                            modelMat = translate(+2, 0, +2, modelMat);
                            modelMat = scale(1.05, 1.05, 1.05, modelMat); // prevent z fighting
                            modelMat = translate(-2, 0, -2, modelMat);
                            modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                            break;
                        case Orientation.Vertical:
                            modelMat = translate(0, +2, +2, modelMat);
                            modelMat = scale(1.05, 1.05, 1.05, modelMat); // prevent z fighting
                            modelMat = translate(0, -2, -2, modelMat);
                            modelMat = rotationXZ(Math.PI / 2, modelMat);
                            break;
                        case Orientation.Horizontal:
                            modelMat = translate(+2, +2, 0, modelMat);
                            modelMat = scale(1.05, 1.05, 1.05, modelMat); // prevent z fighting
                            modelMat = translate(-2, -2, 0, modelMat);
                            break;
                        default:
                    }

                    let modelLoc = gl.getUniformLocation(fenceProgram!, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.uniform3fv(colorLoc, [.5, 0., 0.]);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                }
            }
        };

    }
}
