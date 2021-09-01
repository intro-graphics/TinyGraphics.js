export default /* glsl */ `
precision mediump float;
varying vec4 VERTEX_COLOR;

void main(){
    // The interpolation gets done directly on the per-vertex colors:
    gl_FragColor = VERTEX_COLOR;
}
`;