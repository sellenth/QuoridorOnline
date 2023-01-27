import { Vec3, Mat4 } from "../shared/types"

export function addVec3(a: Vec3, b: Vec3): Vec3
{
    return [ a[0] + b[0], a[1] + b[1],  a[2] + b[2] ];
}

export function subVec3(a: Vec3, b: Vec3): Vec3
{
    return [ a[0] - b[0], a[1] - b[1],  a[2] - b[2] ];
}

export function scaleVec3(a: Vec3, m: number): Vec3
{
    return [ a[0] * m, a[1] * m, a[2] * m];
}

export function crossProductVec3(a: Vec3, b: Vec3): Vec3
{
    return [
        a[1] * b[2] - a[2] * b[1], 
        a[2] * b[0] - a[0] * b[2],  
        a[0] * b[1] - a[1] * b[0]
    ]
}

export function translate(x: number, y: number, z: number, m: Mat4): Mat4
{
    return multiply (m, [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, z, 1
    ]);
}

export function scale(x: number, y: number, z: number, m: Mat4): Mat4
{
    return multiply (m, [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    ])
}

export function degreesToRadians(d: number)
{
    return d * Math.PI / 180;
}

export function cos_d(d: number): number
{
    return (Math.cos(degreesToRadians(d)));
}

export function sin_d(d: number): number
{
    return (Math.sin(degreesToRadians(d)));
}

export function tan_d(d: number): number
{
    return (Math.tan(degreesToRadians(d)));
}

export function rotationXY(rad: number, m: Mat4): Mat4
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        c, -s, 0, 0,
        s, c,  0, 0,
        0, 0,  1, 0,
        0, 0,  0, 1,
    ])
}

export function rotationXZ(rad: number, m: Mat4): Mat4
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        c, 0, s, 0,
        0, 1,  0, 0,
       -s, 0, c, 0,
        0, 0,  0, 1,
    ])
}

export function rotationYZ(rad: number, m: Mat4): Mat4
{
    let c = Math.cos(rad);
    let s = Math.sin(rad);
    return multiply(m, [
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0,  0, 1,
    ])
}

export function normalizeVec3(v: Vec3): Vec3
{
    let mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

    if (mag > 0.00001)
    {
        return [v[0] / mag, v[1] / mag, v[2] / mag];
    } else
    {
        return [0, 0, 0];
    }
}

export function lookForward(camPos: Vec3, upVec: Vec3, front: Vec3): Mat4
{
    let zAxis = normalizeVec3(front);
    let xAxis = normalizeVec3(crossProductVec3( zAxis, upVec ));
    let yAxis = normalizeVec3(crossProductVec3( xAxis, zAxis ));

    return [
         xAxis[0],  xAxis[1],  xAxis[2], 0,
         yAxis[0],  yAxis[1],  yAxis[2], 0,
         zAxis[0],  zAxis[1],  zAxis[2], 0,
        camPos[0], camPos[1], camPos[2], 1
    ]

}

export function lookAt(camPos: Vec3, upVec: Vec3, lookAt: Vec3): Mat4
{
    let zAxis = normalizeVec3(subVec3(camPos, lookAt));
    let xAxis = normalizeVec3(crossProductVec3( zAxis, upVec ));
    let yAxis = normalizeVec3(crossProductVec3( xAxis, zAxis ));

    return [
         xAxis[0],  xAxis[1],  xAxis[2], 0,
         yAxis[0],  yAxis[1],  yAxis[2], 0,
         zAxis[0],  zAxis[1],  zAxis[2], 0,
        camPos[0], camPos[1], camPos[2], 1
    ]

}

export function projection(fieldOfViewInRadians: number, aspect: number, near: number, far: number): Mat4
{
   //https://stackoverflow.com/questions/28286057/trying-to-understand-the-math-behind-the-perspective-matrix-in-webgl/28301213#28301213
   //The inner mechinations of math are an enigma
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
 
    return [
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (near + far) * rangeInv, -1,
      0, 0, near * far * rangeInv * 2, 0
    ];
}

export function invertMat4(m: Mat4): Mat4
{
    let inv = new Array(16);
    let det = 0;
    let i;

    inv[0] = m[5]  * m[10] * m[15] - 
             m[5]  * m[11] * m[14] - 
             m[9]  * m[6]  * m[15] + 
             m[9]  * m[7]  * m[14] +
             m[13] * m[6]  * m[11] - 
             m[13] * m[7]  * m[10];

    inv[4] = -m[4]  * m[10] * m[15] + 
              m[4]  * m[11] * m[14] + 
              m[8]  * m[6]  * m[15] - 
              m[8]  * m[7]  * m[14] - 
              m[12] * m[6]  * m[11] + 
              m[12] * m[7]  * m[10];

    inv[8] = m[4]  * m[9] * m[15] - 
             m[4]  * m[11] * m[13] - 
             m[8]  * m[5] * m[15] + 
             m[8]  * m[7] * m[13] + 
             m[12] * m[5] * m[11] - 
             m[12] * m[7] * m[9];

    inv[12] = -m[4]  * m[9] * m[14] + 
               m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14] - 
               m[8]  * m[6] * m[13] - 
               m[12] * m[5] * m[10] + 
               m[12] * m[6] * m[9];

    inv[1] = -m[1]  * m[10] * m[15] + 
              m[1]  * m[11] * m[14] + 
              m[9]  * m[2] * m[15] - 
              m[9]  * m[3] * m[14] - 
              m[13] * m[2] * m[11] + 
              m[13] * m[3] * m[10];

    inv[5] = m[0]  * m[10] * m[15] - 
             m[0]  * m[11] * m[14] - 
             m[8]  * m[2] * m[15] + 
             m[8]  * m[3] * m[14] + 
             m[12] * m[2] * m[11] - 
             m[12] * m[3] * m[10];

    inv[9] = -m[0]  * m[9] * m[15] + 
              m[0]  * m[11] * m[13] + 
              m[8]  * m[1] * m[15] - 
              m[8]  * m[3] * m[13] - 
              m[12] * m[1] * m[11] + 
              m[12] * m[3] * m[9];

    inv[13] = m[0]  * m[9] * m[14] - 
              m[0]  * m[10] * m[13] - 
              m[8]  * m[1] * m[14] + 
              m[8]  * m[2] * m[13] + 
              m[12] * m[1] * m[10] - 
              m[12] * m[2] * m[9];

    inv[2] = m[1]  * m[6] * m[15] - 
             m[1]  * m[7] * m[14] - 
             m[5]  * m[2] * m[15] + 
             m[5]  * m[3] * m[14] + 
             m[13] * m[2] * m[7] - 
             m[13] * m[3] * m[6];

    inv[6] = -m[0]  * m[6] * m[15] + 
              m[0]  * m[7] * m[14] + 
              m[4]  * m[2] * m[15] - 
              m[4]  * m[3] * m[14] - 
              m[12] * m[2] * m[7] + 
              m[12] * m[3] * m[6];

    inv[10] = m[0]  * m[5] * m[15] - 
              m[0]  * m[7] * m[13] - 
              m[4]  * m[1] * m[15] + 
              m[4]  * m[3] * m[13] + 
              m[12] * m[1] * m[7] - 
              m[12] * m[3] * m[5];

    inv[14] = -m[0]  * m[5] * m[14] + 
               m[0]  * m[6] * m[13] + 
               m[4]  * m[1] * m[14] - 
               m[4]  * m[2] * m[13] - 
               m[12] * m[1] * m[6] + 
               m[12] * m[2] * m[5];

    inv[3] = -m[1] * m[6] * m[11] + 
              m[1] * m[7] * m[10] + 
              m[5] * m[2] * m[11] - 
              m[5] * m[3] * m[10] - 
              m[9] * m[2] * m[7] + 
              m[9] * m[3] * m[6];

    inv[7] = m[0] * m[6] * m[11] - 
             m[0] * m[7] * m[10] - 
             m[4] * m[2] * m[11] + 
             m[4] * m[3] * m[10] + 
             m[8] * m[2] * m[7] - 
             m[8] * m[3] * m[6];

    inv[11] = -m[0] * m[5] * m[11] + 
               m[0] * m[7] * m[9] + 
               m[4] * m[1] * m[11] - 
               m[4] * m[3] * m[9] - 
               m[8] * m[1] * m[7] + 
               m[8] * m[3] * m[5];

    inv[15] = m[0] * m[5] * m[10] - 
              m[0] * m[6] * m[9] - 
              m[4] * m[1] * m[10] + 
              m[4] * m[2] * m[9] + 
              m[8] * m[1] * m[6] - 
              m[8] * m[2] * m[5];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det == 0)
    {
        console.error("Matrix can't be inverted");
        return identity();
    }

    det = 1.0 / det;

    for (i = 0; i < 16; i++)
        inv[i] *= det;

    return inv;
}

export function identity(): Mat4
{
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]
}

export function multiply(m1: Mat4, m2: Mat4): Mat4
{
    return [
        m1[0*4 + 0] * m2[0*4 + 0] + m1[1*4 + 0] * m2[0*4 + 1] + m1[2*4 + 0] * m2[0*4 + 2] + m1[3*4 + 0] * m2[0*4 + 3],
        m1[0*4 + 1] * m2[0*4 + 0] + m1[1*4 + 1] * m2[0*4 + 1] + m1[2*4 + 1] * m2[0*4 + 2] + m1[3*4 + 1] * m2[0*4 + 3],
        m1[0*4 + 2] * m2[0*4 + 0] + m1[1*4 + 2] * m2[0*4 + 1] + m1[2*4 + 2] * m2[0*4 + 2] + m1[3*4 + 2] * m2[0*4 + 3],
        m1[0*4 + 3] * m2[0*4 + 0] + m1[1*4 + 3] * m2[0*4 + 1] + m1[2*4 + 3] * m2[0*4 + 2] + m1[3*4 + 3] * m2[0*4 + 3],

        m1[0*4 + 0] * m2[1*4 + 0] + m1[1*4 + 0] * m2[1*4 + 1] + m1[2*4 + 0] * m2[1*4 + 2] + m1[3*4 + 0] * m2[1*4 + 3],
        m1[0*4 + 1] * m2[1*4 + 0] + m1[1*4 + 1] * m2[1*4 + 1] + m1[2*4 + 1] * m2[1*4 + 2] + m1[3*4 + 1] * m2[1*4 + 3],
        m1[0*4 + 2] * m2[1*4 + 0] + m1[1*4 + 2] * m2[1*4 + 1] + m1[2*4 + 2] * m2[1*4 + 2] + m1[3*4 + 2] * m2[1*4 + 3],
        m1[0*4 + 3] * m2[1*4 + 0] + m1[1*4 + 3] * m2[1*4 + 1] + m1[2*4 + 3] * m2[1*4 + 2] + m1[3*4 + 3] * m2[1*4 + 3],

        m1[0*4 + 0] * m2[2*4 + 0] + m1[1*4 + 0] * m2[2*4 + 1] + m1[2*4 + 0] * m2[2*4 + 2] + m1[3*4 + 0] * m2[2*4 + 3],
        m1[0*4 + 1] * m2[2*4 + 0] + m1[1*4 + 1] * m2[2*4 + 1] + m1[2*4 + 1] * m2[2*4 + 2] + m1[3*4 + 1] * m2[2*4 + 3],
        m1[0*4 + 2] * m2[2*4 + 0] + m1[1*4 + 2] * m2[2*4 + 1] + m1[2*4 + 2] * m2[2*4 + 2] + m1[3*4 + 2] * m2[2*4 + 3],
        m1[0*4 + 3] * m2[2*4 + 0] + m1[1*4 + 3] * m2[2*4 + 1] + m1[2*4 + 3] * m2[2*4 + 2] + m1[3*4 + 3] * m2[2*4 + 3],

        m1[0*4 + 0] * m2[3*4 + 0] + m1[1*4 + 0] * m2[3*4 + 1] + m1[2*4 + 0] * m2[3*4 + 2] + m1[3*4 + 0] * m2[3*4 + 3],
        m1[0*4 + 1] * m2[3*4 + 0] + m1[1*4 + 1] * m2[3*4 + 1] + m1[2*4 + 1] * m2[3*4 + 2] + m1[3*4 + 1] * m2[3*4 + 3],
        m1[0*4 + 2] * m2[3*4 + 0] + m1[1*4 + 2] * m2[3*4 + 1] + m1[2*4 + 2] * m2[3*4 + 2] + m1[3*4 + 2] * m2[3*4 + 3],
        m1[0*4 + 3] * m2[3*4 + 0] + m1[1*4 + 3] * m2[3*4 + 1] + m1[2*4 + 3] * m2[3*4 + 2] + m1[3*4 + 3] * m2[3*4 + 3],
    ]
}
