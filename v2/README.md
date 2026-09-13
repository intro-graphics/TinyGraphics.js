# TinyGraphics.js

A small, readable WebGL 2 library for **learning** computer graphics.

TinyGraphics.js handles the tedious parts of GPU programming for you: buffer uploads, shader compilation, uniform lookup and the render loop. It also adds the vector and matrix math that JavaScript lacks. It does **not** hide the ideas you are there to learn. You still build every matrix, write every shader, and place every shape. The whole library is about 2,400 lines of heavily commented JavaScript, with no build step and no dependencies, and reading it is part of the point.

It has been used in UCLA's CS 174A (Introduction to Computer Graphics) since 2016.

> **This is v2** (WebGL 2, GLSL ES 3.00). It breaks compatibility with v1. Course material written for v1 should keep using the [`v1.4-final`](https://github.com/intro-graphics/TinyGraphics.js/tree/v1.4-final) tag. To port code, see [docs/migrating-from-v1.md](docs/migrating-from-v1.md).

## Quick start

```bash
git clone -b v2 https://github.com/intro-graphics/TinyGraphics.js.git
cd TinyGraphics.js
node tools/serve.mjs          # or: python3 -m http.server 8000
```

Open <http://localhost:8000>. You will see `main-scene.js`, a box and an orbiting ball. Edit its `display()` method, reload, and look. Use the **Scene** menu to open the examples.

A server is required because browsers do not load ES modules from `file://` URLs.

## Your first scene in 30 lines

```js
import {defs, tiny} from './common.js';
const {vec3, vec4, color, Mat4, Light, Material, Scene} = tiny;

export class Main_Scene extends Scene {
    constructor() {                                   // create shapes and materials ONCE
        super();
        this.box = new defs.Cube();
        this.plastic = new Material(new defs.Phong_Shader(), {color: color(.9, .6, .2, 1), ambient: .2});
    }

    display(context, program_state) {                 // called every frame
        program_state.set_camera(Mat4.look_at(vec3(0, 2, 8), vec3(0, 0, 0), vec3(0, 1, 0)));
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.aspect_ratio, .1, 100);
        program_state.lights = [new Light(vec4(2, 5, 5, 1), color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000;
        const model_transform = Mat4.rotation(t, 0, 1, 0).times(Mat4.scale(1, 2, 1));
        this.box.draw(context, program_state, model_transform, this.plastic);
    }
}
```

The full walkthrough is [docs/01-first-scene.md](docs/01-first-scene.md).

## What is in the box

| File | Contents |
|---|---|
| [`tiny-graphics.js`](tiny-graphics.js) | The core: `Vector3/4`, `Matrix`, `Mat4`, `Shape`, `Shader`, `Texture`, `Render_Target`, `Program_State`, `Webgl_Manager`, `Scene` |
| [`tiny-graphics-widgets.js`](tiny-graphics-widgets.js) | Page panels: canvas, controls, explanation, code viewer |
| [`common.js`](common.js) | **Import this.** Stock shapes (cube, spheres, surfaces of revolution, …), shaders (basic, Phong, textured) and camera controls |
| [`main-scene.js`](main-scene.js) | Your scene |
| [`examples/`](examples) | Ten example scenes, each teaching one idea (listed below) |
| [`docs/`](docs) | Tutorials and API reference |

## Examples

Open any of these from the menu, or go straight to `index.html?scene=Name`:

| Example | Teaches |
|---|---|
| `Minimal_Webgl_Demo` | The smallest complete program: one shape, one shader, one draw call |
| `Transforms_Sandbox` | Hierarchical modeling with translation, rotation and scale |
| `Axes_Viewer_Test_Scene` | Seeing the coordinate frame at each level of a hierarchy |
| `Surfaces_Demo` | Parametric surfaces, surfaces of revolution, compound shapes |
| `Many_Lights_Demo` | Faking many lights with a two-light shader |
| `Obj_File_Demo` | Loading `.obj` models; texture mapping vs. a fake bump map |
| `Text_Demo` | Text in 3D using a font texture atlas |
| `Scene_To_Texture_Demo` | Multi-pass rendering into a `Render_Target` |
| `Inertia_Demo` | Physics-based motion with a fixed time step |
| `Collision_Demo` | Collision detection in another body's coordinate frame |

## Documentation

1. [Your first scene](docs/01-first-scene.md): Shape, Material, Scene, `display()`, controls
2. [Math conventions](docs/02-math.md): vectors, row-major matrices, transformation order, cameras
3. [Writing shaders](docs/03-shaders.md): how GLSL inputs, uniforms and `update_GPU()` fit together
4. [API reference](docs/api.md)
5. [Migrating from v1](docs/migrating-from-v1.md)

For the graphics theory these examples illustrate, see [graphics-foundations](https://github.com/luckiday/graphics-foundations), a set of topic-by-topic notes with interactive demos built on this library.

## Development

```bash
npm install                  # playwright-core, for the browser check only
npm test                     # math and geometry unit tests (Node, no browser)
npm run check                # unit tests + load every example headless, press every button, screenshot
```

`npm run check` needs a local Chromium with working WebGL 2. It writes screenshots to `tools/shots/`; look at them, because a scene can pass the check and still look wrong. CI runs only `npm test`: headless GPU support on CI machines is too unreliable for a meaningful rendering check.

## Credits

TinyGraphics.js was created by **Garett Ridge** for UCLA CS 174A, as part of his *Encyclopedia of Code* project. It replaced the supplementary code from Edward Angel's *Interactive Computer Graphics*. Yunqi Guo maintained it for later offerings of the course and wrote v2.

## License

No license has been chosen yet. Until one is, the code is published for reading and learning, and all rights remain with its authors.
