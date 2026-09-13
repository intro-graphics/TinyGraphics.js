# API reference

Everything below is reachable after `import {tiny, defs} from './common.js'`. Names under **tiny** come from `tiny-graphics.js` and `tiny-graphics-widgets.js`; names under **defs** come from `common.js`. The source comments hold the full explanations; this page is for looking things up.

## tiny · math

### Vectors

| Constructor | Notes |
|---|---|
| `vec3(x, y, z)` → `Vector3` | |
| `vec4(x, y, z, w)` → `Vector4` | `norm()`/`normalize()` ignore `w` |
| `vec(...values)` / `Vector.of(...)` → `Vector` | any length |
| `color(r, g, b, a = 1)`, `hex_color("#rrggbb", a = 1)` → `Vector4` | channels in [0, 1] |
| `Vector3.cast([x,y,z], ...)`, `Vector.cast(...)` | list of arrays → list of vectors |

| Method | Returns | Modifies `this`? |
|---|---|---|
| `plus(b)`, `minus(b)`, `times(s)`, `times_pairwise(b)` | new vector | no |
| `dot(b)` | number | no |
| `cross(b)` | new `Vector3` | no |
| `norm()`, `normalized()`, `mix(b, s)`, `randomized(s)` | number / new vector | no |
| `add_by(b)`, `subtract_by(b)`, `scale_by(s)`, `scale_pairwise_by(b)`, `normalize()` | — | **yes** |
| `to3()`, `to4(is_point)`, `copy()`, `equals(b)`, `to_string()` | | no |

### Matrix

An array of rows: `M[row][col]`.

| Member | |
|---|---|
| `M.times(b)` | `b` a scalar, a vector (returns a vector) or a matrix |
| `M.pre_multiply(b)` / `M.post_multiply(b)` | overwrite M with b·M / M·b; returns M |
| `M.transposed()`, `M.copy()`, `M.equals(b)`, `M.plus(b)`, `M.minus(b)` | |
| `M.set(rows)`, `M.set_identity(m, n)`, `M.sub_block([r0, c0], [r1, c1])` | |
| `Matrix.column_major(M)` | `Float32Array` for `gl.uniformMatrix*fv` |
| `Matrix.flatten_2D_to_1D(M)` | row-major `Float32Array` (also flattens arrays of vectors) |

### Mat4 (static; each returns a new Matrix)

| Function | Meaning |
|---|---|
| `identity()` | |
| `translation(x, y, z)` or `translation(v)` | |
| `scale(x, y, z)` or `scale(v)` | |
| `rotation(radians, x, y, z)` or `rotation(radians, axis)` | right-handed, about an axis through the origin |
| `look_at(eye, at, up)` | view matrix, world → camera |
| `perspective(fov_y, aspect, near, far)` | `near`/`far` are positive distances |
| `frustum(left, right, bottom, top, near, far)` | off-center perspective; bounds measured on the near plane |
| `orthographic(left, right, bottom, top, near, far)` | |
| `inverse(M)` | throws on a singular matrix |
| `normal_matrix(M)` | 3×3 inverse transpose of M's upper-left 3×3 |

## tiny · GPU objects

### Shape (extends Vertex_Buffer)

```js
class My_Shape extends Shape {
    constructor() {
        super("position", "normal", "texture_coord");     // names of the per-vertex arrays
        this.arrays.position = Vector3.cast([0,0,0], [1,0,0], [0,1,0]);
        this.arrays.normal   = Vector3.cast([0,0,1], [0,0,1], [0,0,1]);
        this.arrays.texture_coord = Vector.cast([0,0], [1,0], [0,1]);
        this.indices = [0, 1, 2];                         // optional; omit to draw vertices in order
    }
}
```

| Member | |
|---|---|
| `draw(context, program_state, model_transform, material, type = "TRIANGLES")` | `type`: any WebGL primitive name, e.g. `"LINES"`, `"LINE_STRIP"`, `"POINTS"` |
| `copy_onto_graphics_card(gl, array_names = all, write_indices = true)` | re-upload after editing arrays (lengths must not change) |
| `Shape_Class.insert_transformed_copy_into(recipient, constructor_args, matrix)` | static; build compound shapes |
| `make_flat_shaded_version()` | returns a class: `new (Cube.prototype.make_flat_shaded_version())()` |
| `flat_shade()`, `duplicate_the_shared_vertices()`, `normalize_positions(keep_aspect = true)` | |

### Shader

Override `vertex_glsl_code()`, `fragment_glsl_code()` and `update_GPU(gl, gpu_addresses, program_state, model_transform, material)`. See [03-shaders.md](03-shaders.md).

### Material (extends Container)

`new Material(shader, {option: value, ...})`. `material.override({color: red})` returns a modified copy. `material.override(red)` guesses the key from the value's type. `material.replace({...})` modifies the material itself.

### Texture

`new Texture(url, {min_filter = "LINEAR_MIPMAP_LINEAR", mag_filter = "LINEAR", wrap = "REPEAT"})`. `ready` becomes true once the image loads. `activate(gl, unit = 0)` binds it.

### Render_Target

`new Render_Target(width = 512, height = 512, {min_filter = "LINEAR", wrap = "CLAMP_TO_EDGE"})`.

| Member | |
|---|---|
| `bind(context, clear_color = [0,0,0,0])` | subsequent draws go into the texture (cleared) |
| `unbind(context)` | back to the canvas |
| use as `material.texture` | samples the last rendered image |

### Light

`new Light(position_vec4, color, size)`. `w = 1` makes a point light and `w = 0` a directional light. Brightness falls off as 1 / (1 + distance² / size).

## tiny · program

### Program_State

| Member | |
|---|---|
| `set_camera(view_matrix)` | sets `view_transform` and `camera_transform` (its inverse) |
| `set_camera_transform(camera_matrix)` | the same, given camera → world |
| `view_transform`, `camera_transform`, `projection_transform` | |
| `lights` | array of `Light`, default `[]` |
| `animation_time`, `animation_delta_time` | milliseconds |
| `animate` | set false to freeze `animation_time` |

### Webgl_Manager (the `context` passed to `display()`)

| Member | |
|---|---|
| `gl` | `WebGL2RenderingContext` (`context` is an alias) |
| `canvas`, `width`, `height`, `aspect_ratio` | size in device pixels |
| `scenes`, `program_state`, `scratchpad` | |

### Scene

Override `display(context, program_state)`, `make_control_panel()`, and optionally `show_explanation(element, webgl_manager)`.

| Member | |
|---|---|
| `children` | child scenes, drawn and controlled with this one |
| `key_triggered_button(label, keys, on_press, color, on_release)` | e.g. `keys = ["Shift", "T"]`; returns the button |
| `slider(label, {min, max, step, value}, on_change)` | returns the `<input>` |
| `live_string(box => box.textContent = ...)` | refreshed every frame |
| `new_line()` | |
| `widget_options` | set in the constructor to override `Canvas_Widget` options |

## tiny · widgets

| Class | |
|---|---|
| `new Canvas_Widget(element, scenes, options)` | options: `aspect` (16/9), `make_controls` (true), `show_explanation` (true), `make_code_nav` (false), `background` (black), `definitions` (for the code navigator) |
| `new Controls_Widget(element, scenes)` | used by `Canvas_Widget` |
| `new Code_Widget(element, class_to_show, {definitions, hide_navigator})` | clickable source viewer |
| `new Text_Widget(element, scenes, webgl_manager)` | calls `scenes[0].show_explanation()` |

## defs · shapes

| Shape | Constructor | Notes |
|---|---|---|
| `Triangle` | `()` | |
| `Square` | `()` | spans −1..1 in x, y; normal +z |
| `Tetrahedron` | `(flat_shaded)` | shows why flat shading needs duplicate vertices |
| `Windmill` | `(num_blades)` | procedural triangles |
| `Cube` | `()` | spans −1..1; compound of 6 squares |
| `Subdivision_Sphere` | `(subdivisions)` | radius 1, even triangles |
| `Grid_Patch` | `(rows, columns, next_row_fn, next_column_fn, texture_range)` | general parametric surface |
| `Surface_Of_Revolution` | `(rows, columns, curve_points, texture_range, angle = 2π)` | sweeps a curve about z |
| `Regular_2D_Polygon`, `Cylindrical_Tube`, `Cone_Tip`, `Torus`, `Grid_Sphere` | `(rows, columns, texture_range)` | |
| `Closed_Cone`, `Capped_Cylinder`, `Rounded_Closed_Cone`, `Rounded_Capped_Cylinder` | `(rows, columns, texture_range)` | |
| `Axis_Arrows` | `()` | a compound shape of many primitives |
| `Minimal_Shape` | `()` | a `Vertex_Buffer` with `position` and `color` |

## defs · shaders

| Shader | Material options | Needs arrays |
|---|---|---|
| `Basic_Shader` | — | `position`, `color` |
| `Funny_Shader` | — | `position`, `texture_coord` |
| `Phong_Shader(num_lights = 2)` | `color`, `ambient`, `diffusivity`, `specularity`, `smoothness` | `position`, `normal` |
| `Textured_Phong(num_lights = 2)` | the above + `texture` | `position`, `normal`, `texture_coord` |
| `Fake_Bump_Map(num_lights = 2)` | same as `Textured_Phong` | same |

## defs · helper scenes

| Scene | |
|---|---|
| `Movement_Controls` | fly / orbit the camera; add once as a child scene |
| `Program_State_Viewer` | pause animation |
| `Minimal_Webgl_Demo` | the smallest complete scene |
