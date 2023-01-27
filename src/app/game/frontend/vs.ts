let vss = `#version 300 es
    in vec4 a_position;

    uniform mat4 projection;
    uniform mat4 camera;
    uniform mat4 model;

    out vec4 modelCoord;
    out vec4 worldCoord;
    void main() 
    {
        modelCoord = a_position;
        worldCoord = model * a_position;
        gl_Position = projection * camera * worldCoord;

    }
`;

export default vss;
