import {BasicShader, Mat4, Material, MinimalShape, Scene} from "../TinyGraphics.js";

/**
 * **Minimal Scene** is an extremely simple example of a Scene class.
 */
class MinimalScene extends Scene {
    constructor(webgl_manager, control_panel) {
        super(webgl_manager, control_panel);
        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false, show_explanation: false};
        // Send a Triangle's vertices to the GPU buffers:
        this.shapes = {triangle: new MinimalShape()};
        this.shader = new BasicShader();
    }

    display(context, graphics_state) {
        // Every frame, simply draw the Triangle at its default location.
        this.shapes.triangle.draw(context, graphics_state, Mat4.identity(), new Material(this.shader));
    }
}

export {MinimalScene}