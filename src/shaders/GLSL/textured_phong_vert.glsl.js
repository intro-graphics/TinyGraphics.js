export default /* glsl */ `
precision mediump float;
#define N_LIGHTS 2

uniform float ambient, diffusivity, specularity, smoothness;
uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
uniform float light_attenuation_factors[N_LIGHTS];
uniform vec4 shape_color;
uniform vec3 squared_scale, camera_center;
varying vec3 N, vertex_worldspace;

varying vec2 f_tex_coord;
attribute vec3 position, normal;

// Position is expressed in object coordinates.
attribute vec2 texture_coord;

uniform mat4 model_transform;
uniform mat4 projection_camera_model_transform;

void main(){                                                                   
    // The vertex's final resting place (in NDCS):
    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
    // The final normal vector in screen space.
    N = normalize( mat3( model_transform ) * normal / squared_scale);
    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
    // Turn the per-vertex texture coordinate into an interpolated variable.
    f_tex_coord = texture_coord;
  } 
`;