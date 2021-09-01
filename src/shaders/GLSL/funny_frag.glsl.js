export default /* glsl */ `
precision mediump float;

uniform float animation_time;
varying vec2 f_tex_coord;

void main(){
    float a = animation_time, u = f_tex_coord.x, v = f_tex_coord.y;
    // Use an arbitrary math function to color in all pixels as a complex
    gl_FragColor = vec4(
    // function of the UV texture coordintaes of the pixel and of time.
    2.0 * u * sin(17.0 * u ) + 3.0 * v * sin(11.0 * v ) + 1.0 * sin(13.0 * a),
    3.0 * u * sin(18.0 * u ) + 4.0 * v * sin(12.0 * v ) + 2.0 * sin(14.0 * a),
    4.0 * u * sin(19.0 * u ) + 5.0 * v * sin(13.0 * v ) + 3.0 * sin(15.0 * a),
    5.0 * u * sin(20.0 * u ) + 6.0 * v * sin(14.0 * v ) + 4.0 * sin(16.0 * a));
}
`