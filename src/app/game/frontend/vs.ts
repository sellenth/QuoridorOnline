export let vss = `#version 300 es
    in vec4 a_position;

    uniform mat4 projection;
    uniform mat4 camera;
    uniform mat4 model;
    uniform float u_time;

    out vec4 modelCoord;
    out vec4 worldCoord;

    void main()
    {
        modelCoord = a_position;
        worldCoord = model * a_position;
        gl_Position = projection * camera * worldCoord;

    }
`;

export let vsPlayer = `#version 300 es
    in vec4 a_position;

    uniform mat4 projection;
    uniform mat4 camera;
    uniform mat4 model;
    uniform float u_time;

    out vec4 modelCoord;
    out vec4 worldCoord;

    void main()
    {

        vec3 movement = .035 * vec3(sin( 2. * u_time +  .8),
                                  sin( 3. * u_time + 1.6),
                                  sin( 1. * u_time +  .2));

        mat4 breathingPawn = mat4( 1., 0., 0., 0.,
                                   0., 1., 0., 0.,
                                   0., 0., 1., 0.,
                                   movement,   1.
                                 );

        modelCoord = a_position;
        worldCoord = breathingPawn * model * a_position;
        gl_Position = projection * camera * worldCoord;

    }
`;

export default vss;
