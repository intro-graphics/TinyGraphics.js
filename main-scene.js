// main-scene.js — YOUR scene.  index.html shows it when no ?scene= is given.
// Start here: change display(), reload the page, look.  See docs/01-first-scene.md.
import {defs, tiny} from './common.js';

const {vec3, vec4, color, Mat4, Light, Material, Scene} = tiny;
const {red, blue, white} = defs.palette;

export class Main_Scene extends Scene {
    constructor() {
        super();
        // Create shapes and materials ONCE, here — never inside display().
        this.shapes = {box: new defs.Cube(), ball: new defs.Subdivision_Sphere(4)};
        const phong = new defs.Phong_Shader();
        this.materials = {
            matte: new Material(phong, {ambient: .35, diffusivity: .7, specularity: .05, color: white}),
            plastic: new Material(phong, {ambient: .3, diffusivity: .75, specularity: .15, smoothness: 20, color: red}),
            gloss: new Material(phong, {ambient: .25, diffusivity: .7, specularity: .6, smoothness: 60, color: blue}),
        };
        this.spin = true;
    }

    make_control_panel() {
        this.key_triggered_button("Toggle spinning", ["t"], () => this.spin = !this.spin);
        this.new_line();
        this.slider("ball height", {min: 0, max: 4, step: .1, value: 2}, v => this.ball_height = v);
    }

    display(context, program_state) {
        // Camera and lights: one place for the whole scene.
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            program_state.set_camera(Mat4.look_at(vec3(0, 3, 10), vec3(0, 1, 0), vec3(0, 1, 0)));
        }
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.aspect_ratio, .1, 100);
        program_state.lights = [new Light(vec4(3, 6, 5, 1), color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000;
        const angle = this.spin ? t : 0;

        // A flat slab to stand on, a box, and a ball orbiting it.  Read each model matrix right to left.
        this.shapes.box.draw(context, program_state, Mat4.translation(0, -1.15, 0).times(Mat4.scale(4, .15, 4)), this.materials.matte);
        this.shapes.box.draw(context, program_state, Mat4.rotation(angle, 0, 1, 0), this.materials.plastic);
        const ball = Mat4.rotation(angle, 0, 1, 0)
            .times(Mat4.translation(3, this.ball_height ?? 2, 0))
            .times(Mat4.scale(.5, .5, .5));
        this.shapes.ball.draw(context, program_state, ball, this.materials.gloss);
    }
}
