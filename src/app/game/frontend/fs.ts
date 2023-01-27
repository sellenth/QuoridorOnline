export const fsFence = `#version 300 es
    precision highp float;
    

    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;

    void main() {

        vec2 st = gl_FragCoord.xy / u_resolution;
        //outColor = vec4(1, 0, 0.5, 1);


        float a = distance(modelCoord.xy, vec2(1.)) / 1.75 + 0.5;

        a *= (cos(u_time) + 1.) / 8. + .5;
        /*
        float pulseTime = 1.5;
        a *= 1. - mod(u_time, pulseTime) / pulseTime;

        float channel1 = mod(u_time, pulseTime * 2.);
        float channel2 = 1. + -step(pulseTime, channel1);
        channel1 = step(pulseTime, channel1);
        */

        vec3 radiatingColor = vec3(.2, a, .8);

        outColor = vec4(radiatingColor + color, 1.);
    }
`;

export const fsPlayer = `#version 300 es
    precision highp float;
    

    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;
    in vec4 worldCoord;

    void main() {

        float z = (worldCoord.z - 5.) / 20.;
        outColor = vec4(0.3 - z, 0., .75 - z, 1.);
    }
`;

export const fsCamera = `#version 300 es
    precision highp float;


    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;
        float b = distance(modelCoord.xy, vec2(0.5, 0.5));
        float z = distance(modelCoord.z, 0.0);
        outColor = vec4(z, 0.0, b * 1.5, 1.);
    }
`;

export const fsGrid = `#version 300 es
    precision highp float;
    

    uniform vec3 camPos;
    uniform vec3 color;
    uniform vec2 u_resolution;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;
    in vec4 worldCoord;

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;

        float a = (5. - distance(camPos.xyz, worldCoord.xyz)) / 5.;
        outColor = vec4(0., .5, 0., a);
    }
`;

export default fsFence;
