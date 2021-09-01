export default /* glsl */ `
precision mediump float;
varying vec2 f_tex_coord;

attribute vec3 position;
// Position is expressed in object coordinates.
attribute vec2 texture_coord;
uniform mat4 projection_camera_model_transform;

void main(){
    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
    // The vertex's final resting place (in NDCS).
    f_tex_coord = texture_coord;
    // Directly use original texture coords and interpolate between.
}
`