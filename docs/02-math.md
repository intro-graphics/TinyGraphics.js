# 2 · Math conventions

TinyGraphics.js follows the conventions of most graphics textbooks: column vectors, right-handed coordinates, and a camera that looks down its −z axis. Mixing up conventions causes more bugs than anything else. Read this page once, carefully.

## Vectors

| Build | Type | Use for |
|---|---|---|
| `vec3(x, y, z)` | `Vector3` | positions, directions, normals |
| `vec4(x, y, z, w)` | `Vector4` | homogeneous points (w = 1) and directions (w = 0), RGBA colors |
| `vec(a, b, ...)` / `Vector.of(...)` | `Vector` | any length, e.g. texture coordinates |
| `color(r, g, b, a)`, `hex_color("#1a9ffa")` | `Vector4` | colors with channels in [0, 1] |

All vector types are `Float32Array`s. Operations fall into two families:

- **Return a new vector:** `plus`, `minus`, `times(scalar)`, `times_pairwise`, `dot`, `cross`, `normalized`, `mix`.
- **Modify the vector itself:** `add_by`, `subtract_by`, `scale_by`, `normalize`.

```js
const a = vec3(1, 0, 0);
const b = a;           // same vector: changing b changes a
const c = a.copy();    // a different vector with the same numbers
```

Homogeneous coordinates matter when a vector is multiplied by a matrix. A **point** (w = 1) is affected by translation; a **direction** (w = 0) is not:

```js
Mat4.translation(5, 0, 0).times(vec4(1, 2, 3, 1))   // → (6, 2, 3, 1)   the point moved
Mat4.translation(5, 0, 0).times(vec4(1, 2, 3, 0))   // → (1, 2, 3, 0)   the direction did not
```

## Matrices are stored as rows

A `Matrix` is an array of rows, so it reads like a matrix written on paper:

```js
Mat4.translation(1, 2, 3)
// [[1, 0, 0, 1],
//  [0, 1, 0, 2],
//  [0, 0, 1, 3],
//  [0, 0, 0, 1]]      M[row][column]; the translation is in the last column
```

Vectors are columns, multiplied on the right: `M.times(v)`.

GLSL stores matrices **column by column**, so every matrix is transposed on its way to the GPU:

```js
gl.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.column_major(model_transform));
```

In the shader, `M * v` then means the same thing it means here.

## Transformation order

`A.times(B)` is the matrix product AB, and `AB · p` applies **B first**:

```js
const T = Mat4.translation(2, 0, 0), R = Mat4.rotation(Math.PI / 2, 0, 0, 1);
T.times(R).times(vec4(1, 0, 0, 1))   // rotate (1,0,0) to (0,1,0), then translate → (2, 1, 0)
R.times(T).times(vec4(1, 0, 0, 1))   // translate to (3,0,0), then rotate        → (0, 3, 0)
```

For building a matrix one step at a time:

| Call | Result |
|---|---|
| `M = M.times(X)` | M·X. X acts **in M's local frame**, the frame the object has so far. |
| `M.post_multiply(X)` | Same as above, but modifies M in place. |
| `M.pre_multiply(X)` | X·M. X acts **in world coordinates**, after everything M already does. |

## Rotations

`Mat4.rotation(angle, x, y, z)` (or `Mat4.rotation(angle, axis_vector)`) rotates by `angle` **radians** about an axis through the origin. The rotation is right-handed: point your right thumb along the axis and your fingers curl in the positive direction. For example, +90° about z takes the x axis to the y axis. The axis does not need to be unit length.

## Camera, view and projection

Three matrices take a vertex from its shape's own coordinates to the screen:

```
clip = projection_transform · view_transform · model_transform · position
```

| Matrix | Maps | Build with |
|---|---|---|
| `model_transform` | object → world | `Mat4.translation/rotation/scale`, passed to `draw()` |
| `program_state.view_transform` | world → camera | `Mat4.look_at(eye, at, up)`, passed to `set_camera()` |
| `program_state.projection_transform` | camera → clip | `Mat4.perspective`, `Mat4.orthographic`, `Mat4.frustum` |

Camera space is right-handed with the camera at the origin, **looking down −z**, with +y up and +x to the right. Points in front of the camera therefore have negative z.

`program_state.camera_transform` is the inverse of the view matrix (camera → world). Its last column is the eye position. `set_camera()` keeps the two in sync.

**Projection conventions.** `near` and `far` are positive **distances**, not z coordinates. After the perspective divide, the near plane (z = −near) lands at −1 and the far plane (z = −far) at +1. The unit tests in [`tools/test-math.mjs`](../tools/test-math.mjs) check exactly these properties, and are a good place to see each convention in executable form.

## Normals need a different matrix

A normal must stay perpendicular to its surface. Under non-uniform scale, transforming it by the model matrix breaks that. The correct matrix is the **inverse transpose** of the model matrix's upper 3×3:

```js
const N = Mat4.normal_matrix(model_transform);   // a 3×3 Matrix
```

`Phong_Shader` sends this to the GPU as `uniform mat3 normal_matrix`. For pure rotations it equals the rotation itself.
