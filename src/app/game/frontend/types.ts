import { Vec3 } from "../shared/types";

export type Player = {
    id: string
    pos: Vec3,
    color: Vec3,
    fences: number
    goalZ: number
}
