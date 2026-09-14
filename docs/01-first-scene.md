# 1 · Your first scene

This tutorial builds a small animated scene from an empty file and explains each piece of TinyGraphics.js as it comes up. It assumes you can read JavaScript classes and know what a matrix is.

## 0. Run the page

```bash
node tools/serve.mjs        # or: python3 -m http.server 8000
```

Open <http://localhost:8000>. With no `?scene=` in the URL, the page shows the scene exported from `main-scene.js`. Replace that file's contents as you follow along, then reload after each step.

Keep the browser's developer console open. If anything throws, the render loop stops and the error, including shader compile errors with line numbers, appears over the canvas.

## 1. The four objects in every program

| Object | What it is | When you create it |
|---|---|---|
| **Shape** | Vertex data (positions, normals, texture coordinates) plus the indices that connect vertices into triangles. It is uploaded to the GPU on first draw. | Once, in the constructor |
| **Shader** | A GPU program: a vertex shader and a fragment shader written in GLSL. | Once, in the constructor |
| **Material** | A Shader plus the settings for one kind of surface (color, shininess, texture). | Once, or as cheap `override()` copies |
| **Program_State** | Everything shared by the whole frame: camera, projection, lights, time. | Provided to you |

Your **Scene** ties them together. Its `display()` runs once per frame and calls `shape.draw(...)` for everything visible.

> Never write `new Cube()` or `new Phong_Shader()` inside `display()`. That rebuilds and re-uploads the object 60 times a second. The library throws an error after about 200 uploads to catch exactly this mistake.

## 2. An empty scene

```js
import {defs, tiny} from './common.js';
const {vec3, vec4, color, Mat4, Light, Material, Scene} = tiny;

export class Main_Scene extends Scene {
    constructor() {
        super();
    }

    display(context, program_state) {
    }
}
```

`common.js` gives you two objects:
- `tiny` holds the core library and the widgets.
- `defs` holds ready-made shapes and shaders.

The destructuring line pulls the names you use into scope. The canvas is plain paper colour: nothing is drawn yet.

## 3. A camera and a projection

Before anything can appear, the program state needs two matrices:

```js
display(context, program_state) {
    program_state.set_camera(Mat4.look_at(vec3(0, 2, 8), vec3(0, 0, 0), vec3(0, 1, 0)));
    program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.aspect_ratio, .1, 100);
}
```

- `look_at(eye, at, up)` builds the **view matrix**, which converts world coordinates into the camera's coordinates. Here the camera stands at (0, 2, 8) and looks at the origin.
- `perspective(fov_y, aspect, near, far)` builds the **projection matrix**. It maps the camera's pyramid-shaped field of view onto the cube that WebGL draws. `near` and `far` are distances in front of the camera.

Chapters 05 and 06 of [graphics-foundations](https://github.com/luckiday/graphics-foundations) derive both matrices.

## 4. A shape

```js
constructor() {
    super();
    this.shapes = {box: new defs.Cube()};
    this.materials = {
        plastic: new Material(new defs.Phong_Shader(), {color: color(.9, .6, .2, 1), ambient: .2, diffusivity: .8, specularity: .5})
    };
}

display(context, program_state) {
    // ...camera and projection as above...
    program_state.lights = [new Light(vec4(2, 5, 5, 1), color(1, 1, 1, 1), 1000)];
    this.shapes.box.draw(context, program_state, Mat4.identity(), this.materials.plastic);
}
```

`draw(context, program_state, model_transform, material)` places the shape with a **model matrix**. The identity leaves it where it was built: `Cube` spans −1 to 1 on each axis.

The light's position is homogeneous. w = 1 makes it a point light at (2, 5, 5); w = 0 would make it a directional light shining from direction (2, 5, 5), like the sun. The last argument controls how quickly the light fades with distance.

## 5. Transformations and animation

```js
const t = program_state.animation_time / 1000;           // seconds
let model_transform = Mat4.rotation(t, 0, 1, 0)           // spin about y ...
    .times(Mat4.translation(3, 0, 0))                     // ... after moving out to x = 3 ...
    .times(Mat4.scale(.5, .5, .5));                       // ... after shrinking.
this.shapes.box.draw(context, program_state, model_transform, this.materials.plastic);
```

A product `A.times(B)` applies `B` first. You can read the chain above in two ways that give the same picture:

- **Right to left, fixed world axes.** Shrink the box, move it to x = 3, then rotate that position about the world's y axis, so it orbits.
- **Left to right, moving coordinate frame.** Rotate the frame, step 3 units along the frame's new x axis, and shrink within that frame.

Hierarchies (arms on bodies, moons around planets) are built by continuing to multiply onto the same matrix. [`examples/transforms-sandbox.js`](../examples/transforms-sandbox.js) is a longer worked example.

## 6. Controls

```js
make_control_panel() {
    this.key_triggered_button("Pause spinning", ["p"], () => this.paused = !this.paused);
    this.new_line();
    this.slider("orbit radius", {min: 0, max: 6, step: .1, value: 3}, v => this.radius = v);
    this.new_line();
    this.live_string(box => box.textContent = `radius = ${this.radius.toFixed(1)}`);
}
```

- `key_triggered_button(label, keys, callback)` adds a button with a keyboard shortcut.
- `slider` adds a labelled range input.
- `live_string` shows text that refreshes every frame.

To fly the camera with the keyboard and mouse, add the stock camera controls as a child scene once:

```js
if (!context.scratchpad.controls) {
    this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
    program_state.set_camera(Mat4.look_at(vec3(0, 2, 8), vec3(0, 0, 0), vec3(0, 1, 0)));   // initial view only
}
```

When the controls are active, set the camera only on this first frame. Otherwise your `set_camera` call overwrites the user's movement every frame.

## 7. Where to go next

- Write your own shader: [03-shaders.md](03-shaders.md).
- Build your own shape: read `Square`, `Cube` and `Subdivision_Sphere` in [`common.js`](../common.js), in that order.
- Use a texture: `new Material(new defs.Textured_Phong(), {texture: new Texture("assets/grid.png"), ambient: .5})`.
- Render to a texture: [`examples/scene-to-texture-demo.js`](../examples/scene-to-texture-demo.js).
