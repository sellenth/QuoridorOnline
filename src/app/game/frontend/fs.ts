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


        float a = distance(modelCoord.xy, vec2(2.)) / 1.75 + 0.5;

        a *= (cos(u_time) + 1.) / 8. + .25;
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
        float d = modelCoord.y / 3.;
        outColor = vec4(color.rg, color.b + d, 1.);
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
    uniform float _3dMode;
    uniform float u_numRows;
    uniform float u_numCols;
    uniform float u_time;
    out vec4 outColor;

    in vec4 modelCoord;
    in vec4 worldCoord;

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution;

        float pulse = smoothstep(.8, 1., (sin(u_time * .5) + 1.) / 2.);

        float progress = distance(worldCoord.x, (sin(u_time) + 1.) / 2. * u_numCols);
        float pPrime = (1. - smoothstep(0., 5., progress)) * pulse + (1. - pulse);

        float nearBound = 2.01;
        float inNearZone = 1. - step(nearBound, worldCoord.z);
        vec4  nearZone = vec4(.1, inNearZone, .3, inNearZone * .6 * pPrime);

        float farBound = u_numRows - 2.;
        float inFarZone = step(farBound, worldCoord.z);
        vec4  farZone = vec4(inFarZone, 0., 0., inFarZone * .6 * pPrime);

        float alpha = smoothstep(0., 15., (10. - distance(camPos.xyz, worldCoord.xyz)));
        float interior = step(nearBound, worldCoord.z) - step(farBound, worldCoord.z);
        vec4 interiorColor = vec4(interior, interior, interior, alpha * interior + (1. - _3dMode ));

        outColor = interiorColor + nearZone + farZone ;
    }
`;

export default fsFence;
