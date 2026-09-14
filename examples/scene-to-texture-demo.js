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
        const bump = new defs.Fake_Bump_Map(1);
        this.materials = {
            a: new Material(bump, {ambient: .5, texture: new Texture("assets/rgb.jpg")}),
            b: new Material(bump, {ambient: .5, texture: new Texture("assets/earth.gif")}),
            c: new Material(new defs.Textured_Phong(1), {ambient: 1, diffusivity: 0, specularity: 0, texture: this.target})
        };
        this.spin = 0;
        this.cube_1 = Mat4.translation(-2, 0, 0);
        this.cube_2 = Mat4.translation(2, 0, 0);
    }

    make_control_panel() {
        this.key_triggered_button("Cube rotation", ["c"], () => this.spin ^= 1);
        this.live_string(box => box.textContent = this.spin ? " spinning" : " still");
    }

    display(context, program_state) {
        program_state.lights = [new Light(vec4(-5, 5, 5, 1), color(0, 1, 1, 1), 100000)];
        const dt = program_state.animation_delta_time / 1000;
        program_state.set_camera(Mat4.look_at(vec3(0, 0, 5), vec3(0, 0, 0), vec3(0, 1, 0)));

        this.cube_1.post_multiply(Mat4.rotation(this.spin * dt * 30 / 60 * 2 * Math.PI, 1, 0, 0));
        this.cube_2.post_multiply(Mat4.rotation(this.spin * dt * 20 / 60 * 2 * Math.PI, 0, 1, 0));

        // Pass 1: into the texture.  The target is square, so use a square aspect ratio here.
        this.target.bind(context, [.9, .9, .95, 1]);
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, 1, .5, 500);
        this.shapes.box.draw(context, program_state, this.cube_1, this.materials.a);
        this.target.unbind(context);

        // Pass 2: onto the canvas.
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.aspect_ratio, .5, 500);
        this.shapes.box.draw(context, program_state, this.cube_1, this.materials.b);
        this.shapes.box_2.draw(context, program_state, this.cube_2, this.materials.c);
    }

    show_explanation(document_element) {
        document_element.innerHTML += `<p>Two rendering passes per frame. First the left cube is drawn into an off-screen
            <code>Render_Target</code> (a framebuffer with a texture attached) instead of the canvas. Then the real scene is
            drawn, and the right cube is textured with the image that the first pass produced.</p>`;
    }
}
