export default /* glsl */ `
precision mediump float;
#define N_LIGHTS 2

uniform float ambient, diffusivity, specularity, smoothness;
uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
uniform float light_attenuation_factors[N_LIGHTS];
uniform vec4 shape_color;
uniform vec3 squared_scale, camera_center;

// Specifier "varying" means a variable's final value will be passed from the vertex shader
// on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
// pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
varying vec3 N, vertex_worldspace;

attribute vec3 position, normal;
// Position is expressed in object coordinates.

uniform mat4 model_transform;
uniform mat4 projection_camera_model_transform;

void main(){
    // The vertex's final resting place (in NDCS):
    gl_Position = projection_camera_model_transform * vec4(position, 1.0);
    // The final normal vector in screen space.
    N = normalize(mat3(model_transform) * normal / squared_scale);
    vertex_worldspace = (model_transform * vec4(position, 1.0)).xyz;
}
`;
