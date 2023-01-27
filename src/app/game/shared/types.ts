export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

export type Mat4 = Float32List;

export type Coordinate = {
    row: number,
    col: number,
    layer: number
}

export type ID = string;

export type Player = {
    id: ID;
    goalY: number;
    numFences: number;
    position: Coordinate;
}

export type NetworkCamera = {
    position: Vec3,
    pitch: number,
    yaw: number,
    id: ID
}

export type Action = {
    heading: Coordinate | undefined;
    fence: Fence | undefined;
}

export enum Orientation {
    Horizontal = 1,
    Vertical = 2,
    Flat = 3
}

export type Fence = {
    coord: Coordinate,
    orientation: Orientation
}

export enum MessageType { GameState, Identity, GameOver, Cameras, ClientCameraPos, ClientAction };

export type Payload = ID | GameStatePayload | NetworkCamera[];

export type ServerPayload = {
    type: MessageType,
    data: Payload
}

export type GameStatePayload = {
    fences: Fence[],
    players: Player[],
    activePlayerId: ID | undefined
}

export type ClientAction = {
    playerId: ID,
    action: Action
}

export type ClientMessage = {
    type: MessageType;
    payload: ClientAction | NetworkCamera
}
