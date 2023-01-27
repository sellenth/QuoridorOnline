import { Orientation, Vec3 } from "../shared/types";

export type Player = {
    id: string
    pos: Vec3,
    color: Vec3,
    walls: number
}

export type Cursor = {
    pos: Vec3,
    orientation: Orientation
}
