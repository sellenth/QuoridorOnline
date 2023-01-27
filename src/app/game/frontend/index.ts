import vss from "./vs";
import { fsFence, fsPlayer, fsCamera, fsGrid } from "./fs";
import { createShader, createProgram, resizeCanvasToDisplaySize, sleep } from "./utils"
import { identity, translate, projection, addVec3, rotationYZ, rotationXZ, scale, degreesToRadians } from "./math"
import { Camera } from "./camera";
import { GameLogic } from "./gameLogic";
import { ClientMessage, GameStatePayload, ID, MessageType, Orientation,
    Player, ServerPayload, Mat4, NetworkCamera } from "../shared/types"

const szFLOAT = 4;

type VisualUnit =
{
    program: WebGLProgram;
    VAO: WebGLVertexArrayObject;
    render: (projMat: Mat4, viewMat: Mat4) => void;
}

class GameStatusHandler
{
    myWallsElement: Node;
    theirWallsElement: Node;
    turnIndicatorElement: Node;
    GameOverModal: Node;

    constructor()
    {
        this.myWallsElement = document.querySelector("#myWalls");
        this.theirWallsElement = document.querySelector("#theirWalls");
        this.turnIndicatorElement = document.querySelector("#turnIndicator");
    }

    Update(myID: ID, state: GameStatePayload)
    {
        state.players.forEach((player) => {
            this.UpdateWalls(myID, player);
        })
        this.UpdateTurnIndicator(myID, state.activePlayerId);

    }

    GameOver(myID: ID, winningID: ID)
    {
        const el = document.querySelector("#gameOver");
        el.textContent = myID == winningID ? "You win" : "Better luck next time";
        el.classList.add("fancy-animation");
        setTimeout(() => {
            el.classList.remove("fancy-animation");
        }, 5000);
    }

    UpdateWalls(myID: ID, player: Player)
    {
        const who = myID == player.id ? "You" : "Them";
        const indicatorElement = myID == player.id ? this.myWallsElement : this.theirWallsElement;
        indicatorElement.textContent = `${who} - ${player.numFences}`;
    }

    UpdateTurnIndicator(myID: ID, activePlayerId: ID)
    {
        let who = myID == activePlayerId ? "your" : "the other player's";
        this.turnIndicatorElement.textContent = `It's ${who} turn.`
    }
}

class FrameTiming
{
    then: number;
    deltaTime: number;
    fps: number;
    elapsed: number;
    counterElement: Node;

    constructor()
    {
        this.then = new Date().getTime() * .001;
        this.counterElement = document.querySelector("#fps").lastChild;
        this.elapsed = 0.;
    }

    tick()
    {
            let now = new Date().getTime() * .001;
            this.deltaTime = now - this.then;
            this.elapsed += this.deltaTime;
            this.then = now;
            this.fps = 1 / this.deltaTime;
            this.counterElement.textContent = this.fps.toFixed();
    }
}

export default class Engine
{
    canvas: HTMLCanvasElement
    gameLogic: GameLogic;
    gl: WebGL2RenderingContext;
    sceneObjects: VisualUnit[];
    camera: Camera;
    networkedCameras: NetworkCamera[];
    frameTiming: FrameTiming;
    gameStateSocket: WebSocket;
    gameStatusHandler: GameStatusHandler;


    constructor()
    {
        this.canvas = document.querySelector("#c");
        this.gameLogic = new GameLogic();
        this.gameLogic.players = [
                {
                    id: "500",
                    pos: [Math.ceil(0 / 2), Math.ceil(0 / 2), Math.ceil(0 / 2) ],
                    color: [10, 155, 10],
                    walls: 10,
                }
        ]
        console.log(this.gameLogic.players)

        this.gl = this.canvas.getContext("webgl2", {premultipliedAlpha: false});
        if (!this.gl) {
            alert("You need a webGL compatible browser")
            return;
        }

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.camera = new Camera();
        this.camera.configureCameraListeners(this.canvas, this.gameLogic);
        this.camera.SetExtents([this.gameLogic.gridSizeXY,
                                this.gameLogic.gridLayers,
                                this.gameLogic.gridSizeXY ]);

        this.networkedCameras = [];

        this.configurePrograms();

        this.frameTiming = new FrameTiming();
        this.gameStatusHandler = new GameStatusHandler();

        //this.configureWebsocket();

    }

    configureWebsocket()
    {
        let connectionURL = location.origin.replace(/^http/, 'ws')
        this.gameStateSocket = new WebSocket(connectionURL, "gamerzone");

        this.gameStateSocket.onmessage = (msg) => {
            this.handleServerPayload(JSON.parse(msg.data));
        }

        this.gameLogic.notifyServer = (msg: ClientMessage) => {
            this.gameStateSocket.send(JSON.stringify(msg));
        };

        setInterval(() => {
            this.gameStateSocket.send(JSON.stringify(
                {
                    type: MessageType.ClientCameraPos,
                    payload: {
                        position: this.camera.GetPosition(),
                        yaw: this.camera.GetYaw(),
                        pitch: this.camera.GetPitch(),
                        id: this.gameLogic.myId
                    }

                }
            ))
        }, 1000)
    }

    handleServerPayload(payload: ServerPayload)
    {
        if (this.gameLogic)
        {
            switch (payload.type)
            {
                case MessageType.Identity:
                    let id = payload.data as ID;
                    this.gameLogic.assignId(id);
                    break;
                case MessageType.GameState:
                    let data = payload.data as GameStatePayload;
                    this.gameLogic.updateFences(data.fences);
                    this.gameLogic.updatePlayers(data.players);
                    this.gameLogic.setActivePlayer(data.activePlayerId);
                    this.gameStatusHandler.Update(this.gameLogic.myId, data);
                    break;
                case MessageType.GameOver:
                    this.gameStatusHandler.GameOver(this.gameLogic.myId, payload.data as ID);
                    break;
                case MessageType.Cameras:
                    this.networkedCameras = payload.data as NetworkCamera[];
                    break;
            }
        }
    }

    async startRenderLoop()
    {
        const gl = this.gl;

        while (true)
        {
            this.frameTiming.tick()

            resizeCanvasToDisplaySize(gl.canvas, 1);

            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            gl.clearColor(0., 0., 0., 0.);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // Update camera position
            this.camera.Move(this.frameTiming.deltaTime);

            // Calculate program independent matrices
            let projMat = projection(3.14 / 2, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, 50);
            let viewMat = this.camera.getViewMatrix();

            this.sceneObjects.forEach( so => {
                so.render(projMat, viewMat);
            });

            await sleep(Math.max(0, 32 - this.frameTiming.deltaTime));
        }

    }

    configurePrograms()
    {
        this.sceneObjects = [];
        this.sceneObjects.push(this.createPlayerProgram());
        this.sceneObjects.push(this.createCameraProgram());
        this.sceneObjects.push(this.createFenceProgram());
        this.sceneObjects.push(this.createGridProgram());
    }

    createGridProgram()
    {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsGrid);


        let gridProgram = createProgram(gl, vs, fs);
        let positionAttribLocation = gl.getAttribLocation(gridProgram, "a_position");

        let gridVAO = gl.createVertexArray();
        gl.bindVertexArray(gridVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let gridData = [];

        for (let a = 0; a < this.gameLogic.gridSizeXY; a++)
        {
            for (let b = 0; b < this.gameLogic.gridLayers; b++)
            {
                gridData.push(0, b, a,
                              this.gameLogic.gridSizeXY - 1, b, a);
            }

        }

        for (let a = 0; a < this.gameLogic.gridSizeXY; a++)
        {
            for (let b = 0; b < this.gameLogic.gridLayers; b++)
            {
                gridData.push( a, b, 0,
                               a, b, this.gameLogic.gridSizeXY - 1);
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
            program: gridProgram,
            VAO: gridVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(gridProgram);
                gl.bindVertexArray(gridVAO);

                let camPosLoc = gl.getUniformLocation(gridProgram, "camPos");
                gl.uniform3fv(camPosLoc, this.camera.GetPosition());

                let projLoc = gl.getUniformLocation(gridProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(gridProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                let modelMat = identity();
                let modelLoc = gl.getUniformLocation(gridProgram, "model");
                gl.uniformMatrix4fv(modelLoc, false, modelMat);

                gl.drawArrays(gl.LINES, 0, gridData.length / 3);
            }
        };
    }

    createPlayerProgram()
    {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsPlayer);

        let playerProgram = createProgram(gl, vs, fs);
        let playerPosAttrib = gl.getAttribLocation(playerProgram, "a_position");

        let playerVAO = gl.createVertexArray();
        gl.bindVertexArray(playerVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let cubeData = [
            0, 0, 0,      255, 0, 0,
            1, 0, 0,      255, 0, 0,
            1, 1, 0,      255, 0, 0,
            0, 1, 0,      255, 0, 0,

            0, 0, 1,      0, 255, 0,
            1, 0, 1,      0, 255, 0,
            1, 1, 1,      0, 255, 0,
            0, 1, 1,      0, 255, 0,


        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeData), gl.STATIC_DRAW);

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


        gl.enableVertexAttribArray(playerPosAttrib);

        // binds currently bound array_buffer (positionBuffer) & ebo (elBuff) to this attribPointer
        gl.vertexAttribPointer(playerPosAttrib, // vertex attribute to modify
                               3, // how many elements per attribute
                               gl.FLOAT, // type of individual element
                               false, //normalize
                               6 * szFLOAT, //stride
                               0 //offset from start of buffer
                              );

        return {
            program: playerProgram,
            VAO: playerVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(playerProgram);
                gl.bindVertexArray(playerVAO);

                let projLoc = gl.getUniformLocation(playerProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(playerProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                this.gameLogic.players.forEach(player => {
                    let modelMat = translate(...addVec3(player.pos, [.2, .2, .2]), identity());
                    modelMat = scale(0.6, 0.6, 0.6, modelMat);

                    let colorLoc = gl.getUniformLocation(playerProgram, "color");
                    gl.uniform3fv(colorLoc, player.color);

                    let modelLoc = gl.getUniformLocation(playerProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                })

                if (this.gameLogic.IsMyTurn() && this.gameLogic.cursorMode == "pawn" )
                {
                    let modelMat = translate(...addVec3(this.gameLogic.getActivePlayer().pos, this.gameLogic.cursor.pos), identity());
                    modelMat = translate(0.4, 0.4, 0.4, modelMat);
                    modelMat = scale(0.2, 0.2, 0.2, modelMat);

                    let colorLoc = gl.getUniformLocation(playerProgram, "color");
                    gl.uniform3fv(colorLoc, [0, 0, 255]);

                    let modelLoc = gl.getUniformLocation(playerProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                }
            }
        };
    }

    createCameraProgram()
    {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsCamera);

        let cameraProgram = createProgram(gl, vs, fs);
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
            program: cameraProgram,
            VAO: cameraVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                gl.useProgram(cameraProgram);
                gl.bindVertexArray(cameraVAO);

                let projLoc = gl.getUniformLocation(cameraProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(cameraProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);


                this.networkedCameras.forEach((camera) => {
                    if (camera.id != this.gameLogic.myId)
                    {
                        let modelMat = translate(...camera.position, identity());
                        modelMat = rotationXZ( degreesToRadians(camera.yaw + 90), modelMat );
                        modelMat = rotationYZ( degreesToRadians(camera.pitch * -1), modelMat );
                        modelMat = translate(-.5, -.5, 0, modelMat);

                        let colorLoc = gl.getUniformLocation(cameraProgram, "color");
                        gl.uniform3fv(colorLoc, [.2, .4, .6]);

                        let modelLoc = gl.getUniformLocation(cameraProgram, "model");
                        gl.uniformMatrix4fv(modelLoc, false, modelMat);

                        gl.drawElements(gl.TRIANGLES, elements.length, gl.UNSIGNED_SHORT, 0);
                    }
                });
            }
        };
    }

    createFenceProgram()
    {
        const gl = this.gl;
        let vs = createShader(gl, gl.VERTEX_SHADER, vss);
        let fs = createShader(gl, gl.FRAGMENT_SHADER, fsFence);

        let fenceProgram = createProgram(gl, vs, fs);
        let fencePosAttrib = gl.getAttribLocation(fenceProgram, "a_position");

        let fenceVAO = gl.createVertexArray();
        gl.bindVertexArray(fenceVAO);

        let buff = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buff);

        let farExtent = 1.9;
        let nearExtent = .1;

        let fenceData = [
            nearExtent, nearExtent, -.05,
            farExtent, nearExtent, -.05,
            farExtent, farExtent, -.05,
            nearExtent, farExtent, -.05,

            nearExtent, nearExtent, .05,
            farExtent, nearExtent, .05,
            farExtent, farExtent, .05,
            nearExtent, farExtent, .05,
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
            program: fenceProgram,
            VAO: fenceVAO,
            render: (projMat: Mat4, viewMat: Mat4) => {
                // Draw Fences
                gl.useProgram(fenceProgram);
                gl.bindVertexArray(fenceVAO);

                let projLoc = gl.getUniformLocation(fenceProgram, "projection");
                gl.uniformMatrix4fv(projLoc, false, projMat);

                let camLoc = gl.getUniformLocation(fenceProgram, "camera");
                gl.uniformMatrix4fv(camLoc, false, viewMat);

                let colorLoc = gl.getUniformLocation(fenceProgram, "color");

                let timeLoc = gl.getUniformLocation(fenceProgram, "u_time");
                gl.uniform1f(timeLoc, this.frameTiming.elapsed);

                this.gameLogic.fencePositions.forEach(fence => {
                    let modelMat = translate (...fence.pos, identity());
                    if (fence.orientation == Orientation.Flat)
                        modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                    if (fence.orientation == Orientation.Vertical)
                        modelMat = rotationXZ(Math.PI / 2, modelMat);

                    let modelLoc = gl.getUniformLocation(fenceProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.uniform3fv(colorLoc, [.0, 0., 0.]);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                })

                if ( this.gameLogic.IsMyTurn() && this.gameLogic.cursorMode == "fence")
                {
                    let modelMat = translate (...this.gameLogic.cursor.pos, identity());
                    modelMat = scale (1.01, 1.01, 1.01, modelMat); // prevent z fighting
                    if (this.gameLogic.cursor.orientation == Orientation.Flat)
                        modelMat = rotationYZ(3 * Math.PI / 2, modelMat);
                    if (this.gameLogic.cursor.orientation == Orientation.Vertical)
                        modelMat = rotationXZ(Math.PI / 2, modelMat);

                    let modelLoc = gl.getUniformLocation(fenceProgram, "model");
                    gl.uniformMatrix4fv(modelLoc, false, modelMat);

                    gl.uniform3fv(colorLoc, [.5, 0., 0.]);

                    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
                }
            }
        };

    }
}
