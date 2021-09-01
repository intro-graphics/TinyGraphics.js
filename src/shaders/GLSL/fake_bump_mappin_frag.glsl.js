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
// ***** PHONG SHADING HAPPENS HERE: *****
vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){
    // phong_model_lights():  Add up the lights' contributions.
    vec3 E = normalize( camera_center - vertex_worldspace );
    vec3 result = vec3( 0.0 );
    for(int i = 0; i < N_LIGHTS; i++){
        // Lights store homogeneous coords - either a position or vector.  If w is 0, the
        // light will appear directional (uniform direction from all points), and we
        // simply obtain a vector towards the light by directly using the stored value.
        // Otherwise if w is 1 it will appear as a point light -- compute the vector to
        // the point light's location from the current surface point.  In either case,
        // fade (attenuate) the light as the vector needed to reach it gets longer.
        vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz -
        light_positions_or_vectors[i].w * vertex_worldspace;
        float distance_to_light = length( surface_to_light_vector );

        vec3 L = normalize( surface_to_light_vector );
        vec3 H = normalize( L + E );
        // Compute the diffuse and specular components from the Phong
        // Reflection Model, using Blinn's "halfway vector" method:
        float diffuse  =      max( dot( N, L ), 0.0 );
        float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
        float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );

        vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
        + light_colors[i].xyz * specularity * specular;
        result += attenuation * light_contribution;
    }
    return result;
}

void main(){
    // Sample the texture image in the correct place:
    vec4 tex_color = texture2D( texture, f_tex_coord );
    if( tex_color.w < .01 ) discard;
    // Slightly disturb normals based on sampling the same image that was used for texturing:
    vec3 bumped_N  = N + tex_color.rgb - .5*vec3(1,1,1);
    // Compute an initial (ambient) color:
    gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
    // Compute the final color with contributions from lights:
    gl_FragColor.xyz += phong_model_lights( normalize( bumped_N ), vertex_worldspace );
  } 
`;