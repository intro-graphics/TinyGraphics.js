# 3 · Writing shaders

A `Shader` subclass has three jobs:

| Method | Returns / does |
|---|---|
| `vertex_glsl_code()` | GLSL source of the vertex shader, starting with `#version 300 es` |
| `fragment_glsl_code()` | GLSL source of the fragment shader, starting with `#version 300 es` |
| `update_GPU(gl, gpu_addresses, program_state, model_transform, material)` | sends the values this draw needs to the shader's uniforms |

The library compiles and links the program on first use and looks up where every uniform and input lives. If compilation fails, it shows the error over the canvas with numbered source lines.

## How data reaches a shader

There are three routes, and each kind of data has exactly one:

| Data | Varies per | Arrives as | Comes from |
|---|---|---|---|
| position, normal, texture_coord, … | vertex | `in` variables of the vertex shader | the Shape's `arrays`, **matched by name** |
| matrices, colors, time, lights | draw call | `uniform` variables (both shaders) | `update_GPU()`, from the Material and Program_State |
| anything the vertex shader computes | fragment | vertex `out` → fragment `in`, interpolated | the rasterizer |

Name matching is the rule that trips people up. A shader line `in vec2 texture_coord;` reads the shape's `this.arrays.texture_coord`. If the shape has no array by that name, the input reads as zero and the console warns once.

## A complete shader: color by normal

This shader colors each surface by the direction it faces. It is useful for debugging normals.

```js
import {tiny} from './common.js';
const {Shader, Matrix, Mat4} = tiny;

export class Normal_Color_Shader extends Shader {
    vertex_glsl_code() {
        return `#version 300 es
            precision mediump float;
            in vec3 position;                       // from shape.arrays.position
            in vec3 normal;                         // from shape.arrays.normal
            uniform mat4 projection_camera_model_transform;
            uniform mat3 normal_matrix;
            out vec3 world_normal;                  // handed to the rasterizer

            void main() {
                gl_Position = projection_camera_model_transform * vec4(position, 1.0);
                world_normal = normal_matrix * normal;
            }`;
    }

    fragment_glsl_code() {
        return `#version 300 es
            precision mediump float;
            in vec3 world_normal;                   // interpolated across the triangle
            out vec4 frag_color;

            void main() {
                frag_color = vec4(normalize(world_normal) * 0.5 + 0.5, 1.0);   // map [-1,1] to [0,1]
            }`;
    }

    update_GPU(gl, gpu_addresses, program_state, model_transform, material) {
        const PCM = program_state.projection_transform
            .times(program_state.view_transform).times(model_transform);
        gl.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false, Matrix.column_major(PCM));
        gl.uniformMatrix3fv(gpu_addresses.normal_matrix, false, Matrix.column_major(Mat4.normal_matrix(model_transform)));
    }
}
```

Use it like any shader: `new Material(new Normal_Color_Shader())`.

`gpu_addresses.NAME` is the location of `uniform ... NAME`. A uniform the compiler finds unused is optimized away, and its address is then `undefined`. WebGL ignores sets to an undefined address, so a typo fails silently. When a uniform seems to have no effect, check that the shader actually uses it.

## GLSL ES 3.00 in one table

| Concept | GLSL ES 3.00 (v2) | GLSL ES 1.00 (v1, WebGL 1) |
|---|---|---|
| per-vertex input | `in vec3 position;` | `attribute vec3 position;` |
| vertex → fragment | `out` in vertex, `in` in fragment | `varying` in both |
| fragment output | `out vec4 frag_color;` (any name) | `gl_FragColor` |
| sample a texture | `texture(sampler, uv)` | `texture2D(sampler, uv)` |

`texture` is now a built-in function name, so a sampler can no longer be called `texture`. The stock textured shaders name it `texture_image`.

Declare the default float precision (`precision mediump float;`) in both shaders. If a uniform `int` or `bool` is shared by both stages, also declare `precision mediump int;` in both. The two stages default to different int precisions, and a mismatched uniform stops the program from linking.

## Extending a stock shader

`Phong_Shader` keeps its lighting code in `shared_glsl_code()`, so a subclass can reuse it. `Textured_Phong` overrides only the vertex and fragment `main()` and calls `super.update_GPU()` before binding its texture. Read the two classes in [`common.js`](../common.js) side by side; together they are the template for most custom shaders.
