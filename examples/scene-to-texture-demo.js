import {defs, tiny} from '../common.js';
// Pull these names into this module's scope for convenience:
const {vec3, vec4, color, Mat4, Light, Material, Texture, Render_Target, Scene} = tiny;

export class Scene_To_Texture_Demo extends Scene {
    // **Scene_To_Texture_Demo** — multi-pass rendering with a framebuffer.
    //   Pass 1: draw the left cube into an off-screen Render_Target (a texture) instead of the canvas.
    //   Pass 2: draw the real scene, texturing the right cube with the image produced by pass 1.
    // The same two-pass structure underlies shadow maps (pass 1 renders depth from the light),
    // mirrors (pass 1 renders from the reflected camera), and post-processing effects.
    constructor() {
        super();
        this.shapes = {box: new defs.Cube(), box_2: new defs.Cube()};
        this.shapes.box_2.arrays.texture_coord.forEach(p => p.scale_by(2));   // tile the rendered image 2×2

        this.target = new Render_Target(512, 512, {wrap: "REPEAT"});
        this.materials = {
            // The same material in both passes, so the right cube really shows a picture of the left one:
            cube: new Material(new defs.Textured_Phong(1), {
                color: color(.12, .12, .12, 1), ambient: .75, diffusivity: 1, specularity: .2, smoothness: 30,
                texture: new Texture("assets/grid.png")
            }),
            picture: new Material(new defs.Textured_Phong(1), {ambient: 1, diffusivity: 0, specularity: 0, texture: this.target})
        };
        this.spin = 1;
        this.cube_1 = Mat4.translation(-2, 0, 0).times(Mat4.rotation(.5, 1, 1, 0));
        this.cube_2 = Mat4.translation(2, 0, 0).times(Mat4.rotation(-.6, 0, 1, 0));
    }

    make_control_panel() {
        this.key_triggered_button("Cube rotation", ["c"], () => this.spin ^= 1);
        this.live_string(box => box.textContent = this.spin ? " spinning" : " still");
    }

    display(context, program_state) {
        program_state.lights = [new Light(vec4(-3, 4, 6, 1), color(1, 1, 1, 1), 100000)];
        const dt = program_state.animation_delta_time / 1000;
        this.cube_1.post_multiply(Mat4.rotation(this.spin * dt * 30 / 60 * 2 * Math.PI, 1, 0, 0));
        this.cube_2.post_multiply(Mat4.rotation(this.spin * dt * 10 / 60 * 2 * Math.PI, 0, 1, 0));

        // Pass 1: into the texture, with a camera of its own aimed straight at the left cube.
        // The target is square, so the projection uses aspect ratio 1.
        this.target.bind(context, [...defs.palette.white]);
        program_state.set_camera(Mat4.look_at(vec3(-2, 0, 6), vec3(-2, 0, 0), vec3(0, 1, 0)));
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, 1, .5, 500);
        this.shapes.box.draw(context, program_state, this.cube_1, this.materials.cube);
        this.target.unbind(context);

        // Pass 2: onto the canvas, from the scene camera.  The right cube wears the picture, tiled 2×2.
        program_state.set_camera(Mat4.look_at(vec3(0, 0, 6), vec3(0, 0, 0), vec3(0, 1, 0)));
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.aspect_ratio, .5, 500);
        this.shapes.box.draw(context, program_state, this.cube_1, this.materials.cube);
        this.shapes.box_2.draw(context, program_state, this.cube_2, this.materials.picture);
    }

    show_explanation(document_element) {
        document_element.innerHTML += `<p>Two rendering passes per frame. First the left cube is drawn into an off-screen
            <code>Render_Target</code> (a framebuffer with a texture attached) instead of the canvas, by a camera aimed straight
            at it. Then the real scene is drawn from the scene camera, and the right cube is textured with the picture the
            first pass produced, tiled 2×2. Both passes happen every frame, so the picture moves with the cube.</p>`;
    }
}
