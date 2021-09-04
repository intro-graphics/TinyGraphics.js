import {
    color,
    Cube,
    Light,
    Mat4,
    Material, MovementControls,
    PhongShader,
    Scene,
    SubdivisionSphere,
    Texture,
    vec,
    vec3,
    vec4,
} from "../src/TinyGraphics.js";

import {ShapeFromFile} from './objFileDemo.js';
import {
    BufferedTexture, ColorPhongShader,
    DepthTextureShader2d,
    LIGHT_DEPTH_TEX_SIZE,
    ShadowTexturedPhongShader,
} from './shadowDemoShader.js';
import {VertexBuffer} from "../src/utils.js";

// 2D shape, to display the texture buffer
const Square =
    class Square extends VertexBuffer {
        constructor() {
            super("position", "normal", "texture_coord");
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0),
                vec3(1, 1, 0), vec3(1, 0, 0), vec3(0, 1, 0),
            ];
            this.arrays.normal = [
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
            ];
            this.arrays.texture_coord = [
                vec(0, 0), vec(1, 0), vec(0, 1),
                vec(1, 1), vec(1, 0), vec(0, 1),
            ];
        }
    };

// The scene
export class ShadowDemo extends Scene {
    constructor() {
        super();
        // Load the model file:
        this.shapes = {
            "monkey": new ShapeFromFile("assets/monkey.obj"),
            "sphere": new SubdivisionSphere(6),
            "cube": new Cube(),
            "square_2d": new Square(),
        };

        // For the monkey
        this.stars = new Material(new ShadowTexturedPhongShader(), {
            color: color(.5, .5, .5, 1),
            ambient: .4, diffusivity: .5, specularity: .5,
            color_texture: new Texture("assets/stars.png"),
            light_depth_texture: null,

        });
        // For the floor or other plain objects
        this.floor = new Material(new ShadowTexturedPhongShader(), {
            color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
            color_texture: null,
            light_depth_texture: null,
        });
        // For the first pass
        this.pure = new Material(new ColorPhongShader(), {});
        // For light source
        this.light_src = new Material(new PhongShader(), {
            color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0,
        });
        // For depth texture display
        this.depth_tex = new Material(new DepthTextureShader2d(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null,
        });

        // To make sure texture initialization only does once
        this.initOk = false;
    }

    makeControlPanel() {
        // // make_control_panel(): Sets up a panel of interactive HTML elements, including
        // // buttons with key bindings for affecting this scene, and live info readouts.
        // this.control_panel.innerHTML += "Dragonfly rotation angle: ";
        // // The next line adds a live text readout of a data member of our Scene.
        // this.live_string(box => {
        //     box.textContent = (this.hover ? 0 : (this.t % (2 * Math.PI)).toFixed(2)) + " radians"
        // });
        // this.new_line();
        // this.new_line();
        // // Add buttons so the user can actively toggle data members of our Scene:
        // this.key_triggered_button("Hover dragonfly in place", ["h"], function () {
        //     this.hover ^= 1;
        // });
        // this.new_line();
        // this.key_triggered_button("Swarm mode", ["m"], function () {
        //     this.swarm ^= 1;
        // });
    }

    textureBufferInit(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new BufferedTexture(this.lightDepthTexture);
        this.stars.light_depth_texture = this.light_depth_texture;
        this.floor.light_depth_texture = this.light_depth_texture;

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    renderScene(context, programState, shadow_pass, draw_light_source = false, draw_shadow = false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let lightPosition = this.lightPosition;
        let light_color = this.light_color;
        const t = programState.animationTime;

        programState.draw_shadow = draw_shadow;

        if (draw_light_source && shadow_pass) {
            this.shapes.sphere.draw(context, programState,
                Mat4.translation(lightPosition[0], lightPosition[1], lightPosition[2]).times(Mat4.scale(.5, .5, .5)),
                this.light_src.override({color: light_color}));
        }

        for (let i of [-1, 1]) { // Spin the 3D model shapes as well.
            const model_transform = Mat4.translation(2 * i, 3, 0)
                .times(Mat4.rotation(t / 1000, -1, 2, 0))
                .times(Mat4.rotation(-Math.PI / 2, 1, 0, 0));
            this.shapes.monkey.draw(context, programState, model_transform, shadow_pass ? this.stars : this.pure);
        }

        let model_trans_floor = Mat4.scale(8, 0.1, 5);
        let model_trans_ball_0 = Mat4.translation(0, 1, 0);
        let model_trans_ball_1 = Mat4.translation(5, 1, 0);
        let model_trans_ball_2 = Mat4.translation(-5, 1, 0);
        let model_trans_ball_3 = Mat4.translation(0, 1, 3);
        let model_trans_ball_4 = Mat4.translation(0, 1, -3);
        let model_trans_wall_1 = Mat4.translation(-8, 2 - 0.1, 0).times(Mat4.scale(0.33, 2, 5));
        let model_trans_wall_2 = Mat4.translation(+8, 2 - 0.1, 0).times(Mat4.scale(0.33, 2, 5));
        let model_trans_wall_3 = Mat4.translation(0, 2 - 0.1, -5).times(Mat4.scale(8, 2, 0.33));
        this.shapes.cube.draw(context, programState, model_trans_floor, shadow_pass ? this.floor : this.pure);
        this.shapes.cube.draw(context, programState, model_trans_wall_1, shadow_pass ? this.floor : this.pure);
        this.shapes.cube.draw(context, programState, model_trans_wall_2, shadow_pass ? this.floor : this.pure);
        this.shapes.cube.draw(context, programState, model_trans_wall_3, shadow_pass ? this.floor : this.pure);
        this.shapes.sphere.draw(context, programState, model_trans_ball_0, shadow_pass ? this.floor : this.pure);
        this.shapes.sphere.draw(context, programState, model_trans_ball_1, shadow_pass ? this.floor : this.pure);
        this.shapes.sphere.draw(context, programState, model_trans_ball_2, shadow_pass ? this.floor : this.pure);
        this.shapes.sphere.draw(context, programState, model_trans_ball_3, shadow_pass ? this.floor : this.pure);
        this.shapes.sphere.draw(context, programState, model_trans_ball_4, shadow_pass ? this.floor : this.pure);
    }

    display(context, programState) {
        const t = programState.animationTime;
        const gl = context.context;
        if (!this.initOk) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.textureBufferInit(gl);

            this.initOk = true;
        }

        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new MovementControls());
            // Define the global camera and projection matrices, which are stored in programState.
            programState.setCamera(Mat4.lookAt(
                vec3(0, 12, 12),
                vec3(0, 2, 0),
                vec3(0, 1, 0),
            )); // Locate the camera here
        }

        // The position of the light
        this.lightPosition = Mat4.rotation(t / 1500, 0, 1, 0).times(vec4(3, 6, 0, 1));
        // The color of the light
        this.light_color = color(
            0.667 + Math.sin(t / 500) / 3,
            0.667 + Math.sin(t / 1500) / 3,
            0.667 + Math.sin(t / 3500) / 3,
            1,
        );

        // This is a rough target of the light.
        // Although the light is point light, we need a target to set the POV of the light
        this.light_view_target = vec4(0, 0, 0, 1);
        this.light_field_of_view = 130 * Math.PI / 180; // 130 degree

        programState.lights = [new Light(this.lightPosition, this.light_color, 1000)];

        // Step 1: set the perspective and camera to the POV of light
        const light_view_mat = Mat4.lookAt(
            vec3(this.lightPosition[0], this.lightPosition[1], this.lightPosition[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        programState.light_view_mat = light_view_mat;
        programState.light_proj_mat = light_proj_mat;
        programState.light_tex_mat = light_proj_mat;
        programState.view_mat = light_view_mat;
        programState.projection_transform = light_proj_mat;
        this.renderScene(context, programState, false, false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        programState.view_mat = programState.camera_inverse;
        programState.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.renderScene(context, programState, true, true, true);

        // Step 3: display the textures
        this.shapes.square_2d.draw(context, programState,
            Mat4.translation(-0.99, .08, 0).times(
                Mat4.scale(0.5, 0.5 * gl.canvas.width / gl.canvas.height, 1),
            ),
            this.depth_tex.override({texture: this.lightDepthTexture}),
        );
    }

    // show_explanation(document_element) {
    //     document_element.innerHTML += "<p>This demo loads an external 3D model file of a monkey.  It uses a condensed version of the \"webgl-obj-loader.js\" "
    //         + "open source library, though this version is not guaranteed to be complete and may not handle some .OBJ files.  It is contained in the class \"ShapeFromFile\". "
    //         + "</p><p>One of these monkeys is lit with bump mapping.  Can you tell which one?</p>";
    // }
}