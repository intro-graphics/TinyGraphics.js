export default /* glsl */ `
precision mediump float;
uniform mat4 projection_camera_model_transform;
attribute vec4 color;
attribute vec3 position;
// Position is expressed in object coordinates.
varying vec4 VERTEX_COLOR;

void main(){
    // Compute the vertex's final resting place (in NDCS), and use the hard-coded color of the vertex:
    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
    VERTEX_COLOR = color;
}
`;