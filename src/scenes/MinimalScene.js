import {BasicShader, Mat4, Material, MinimalShape, Scene} from "../TinyGraphics.js";

/**
 * **Minimal Scene** is an extremely simple example of a Scene class.
 */
class MinimalScene extends Scene {
    constructor(webglManager, controlPanel) {
        super(webglManager, controlPanel);
        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false, showExplanation: false};
        // Send a Triangle's vertices to the GPU buffers:
        this.shapes = {triangle: new MinimalShape()};
        this.shader = new BasicShader();
    }

    display(context, graphicsState) {
        // Every frame, simply draw the Triangle at its default location.
        this.shapes.triangle.draw(context, graphicsState, Mat4.identity(), new Material(this.shader));
    }
}

export {MinimalScene}