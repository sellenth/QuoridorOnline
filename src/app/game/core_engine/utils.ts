import { Mat4 } from "../shared/types"

export function createShader(gl: WebGL2RenderingContext, type: GLuint, source: string) {
    let shader = gl.createShader(type);
    if (!shader) {
        return
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

export function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    let program = gl.createProgram();
    if (!program) {
        return
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    let success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
}


export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, multiplier: number): boolean {
    multiplier = multiplier || 1;
    const width  = canvas.clientWidth  * multiplier || 0;
    const height = canvas.clientHeight * multiplier || 0;
    if (canvas.width !== width ||  canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function clamp(n: number, low: number, high: number)
{
    return Math.max(low, Math.min(n, high));
}

export function logMatrix(m: Mat4)
{
    for (let i = 0; i < 4; i++)
    {
        console.log(m[i * 4 + 0], m[i * 4 + 1], m[i * 4 + 2], m[i * 4 + 3]);
    }
}
