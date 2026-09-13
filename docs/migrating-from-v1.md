# Migrating from v1 to v2

v2 moves TinyGraphics.js to WebGL 2 and fixes several long-standing bugs. Most v1 scenes port in a few minutes. Work through the steps in order. The last section lists behaviour that changed because v1 was wrong, so results may differ even where the code looks the same.

If you are working on a course assignment built on v1, stay on v1. Its last version is tagged [`v1.4-final`](https://github.com/intro-graphics/TinyGraphics.js/tree/v1.4-final).

## 1. Files and imports

| v1 | v2 |
|---|---|
| `examples/common.js` | `common.js` (library root) |
| `import {defs, tiny} from './examples/common.js'` | `import {defs, tiny} from './common.js'` |
| `import {defs, tiny} from './common.js'` (inside `examples/`) | `import {defs, tiny} from '../common.js'` |
| `Object.assign(defs, {My_Scene, ...})` in `main-scene.js` | not needed; register examples in `examples/index.js` |
| edit `Main_Scene = ...` to switch demos | `index.html?scene=Name`, or the Scene menu |
| `server.py`, `host.bat`, `host.command` | `node tools/serve.mjs` or `python3 -m http.server` |

## 2. Shaders: GLSL ES 1.00 → 3.00

Every custom shader needs these edits:

1. Put `#version 300 es` on the **very first line** of both sources, before any comments or blank lines. v2 checks for it and throws if it is missing.
2. In the vertex shader, replace `attribute` with `in`.
3. Replace `varying` with `out` in the vertex shader and `in` in the fragment shader.
4. Declare `out vec4 frag_color;` in the fragment shader and write to it instead of `gl_FragColor`.
5. Replace `texture2D(...)` with `texture(...)`, and rename any sampler called `texture`. `texture` is now a built-in function.
6. If a uniform `int` or `bool` is shared by both stages, add `precision mediump int;` to both.

The stock shaders use `texture_image` as their sampler name.

If your shader shared code through a `shared_glsl_code()` string that the vertex and fragment sources both begin with, move `#version 300 es` into that shared string so it stays on the first line.

## 3. Renamed members

| v1 | v2 | Notes |
|---|---|---|
| `program_state.camera_inverse` | `program_state.view_transform` | world → camera. The v1 name described the math backwards. |
| `program_state.camera_transform` | `program_state.camera_transform` | unchanged: camera → world |
| `graphics_state` (some v1 code) | `program_state` | one name everywhere |
| `context.context` (the GL context) | `context.gl` | `context.context` still works |
| `context.width / context.height` | `context.aspect_ratio` | `width` and `height` still work, in device pixels |
| `Matrix.flatten_2D_to_1D(M.transposed())` | `Matrix.column_major(M)` | the old form still works |
| `webgl_manager.set_size([w, h])` | removed | the canvas fills its container; pass `{aspect: w / h}` to `Canvas_Widget` |
| `unsafe3`, `unsafe4` | removed | use `vec3`, `vec4` |
| `Editor_Widget` | removed | it posted to a server that no longer exists |
| `new Code_Widget(el, cls, additional_scenes, options)` | `new Code_Widget(el, cls, {definitions, hide_navigator})` | |
| `new Texture(file, "NEAREST")` | `new Texture(file, {min_filter: "NEAREST", wrap: "CLAMP_TO_EDGE"})` | the string form still works |

A shader's `update_GPU(context, ...)` now receives the WebGL2 context as its first argument; v1 passed the same thing under the name `context`. `Shader.activate()` now takes `(gl, program_state, model_transform, material)`. v1's `buffer_pointers` argument is gone, because vertex arrays are handled by the shape.

## 4. New in v2

- **`Render_Target`** renders into a texture, for shadow maps, mirrors and post-processing. See `Scene_To_Texture_Demo`.
- **`Mat4.frustum`** builds an off-center perspective projection.
- **`Mat4.normal_matrix`** computes the inverse transpose, the correct matrix for normals.
- **`Scene.slider(label, {min, max, step, value}, on_change)`** adds a range input.
- **Error overlay:** exceptions and shader compile errors (with numbered source lines) appear over the canvas instead of only in the console.
- **Responsive canvas:** it fills its container at the display's pixel density, and works on phones.
- **Tests:** `npm test` runs math unit tests; `npm run check` loads every example in a headless browser.

## 5. Behaviour that changed because v1 was wrong

| Symptom in v1 | Cause | Effect after porting |
|---|---|---|
| `Mat4.orthographic(...)` returned all `NaN` | passed a `vec3` to `scale(x, y, z)` / `translation(x, y, z)` | orthographic projection now works |
| `new Tetrahedron()` threw `Vec is not defined` | typo | it builds |
| Lighting was wrong on shapes that are both rotated and non-uniformly scaled, in either order | `Phong_Shader` divided the transformed normal by the squared lengths of the model matrix's columns, which equals the inverse transpose only when no rotation is combined with the non-uniform scale (measured: the normal of a surface rotated 0.9 rad and stretched 4× tilted 33–39° away from perpendicular) | normals now use the true inverse transpose; such shapes may look different (correct) |
| Dragging to orbit with `Movement_Controls` slowly desynchronized the camera | the arcball applied the same rotation, not its inverse, to the inverse matrix | the camera matrix pair stays exact |
| A shape drawn before any light was set crashed `Phong_Shader` | `program_state.lights` was undefined | `lights` defaults to `[]`; the shape is shown with ambient light only |
