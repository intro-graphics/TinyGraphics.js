import {VertexBuffer} from "../utils.js";
import {color, vec3} from "../TinyGraphics.js";

/**
 * **Minimal_Shape** an even more minimal triangle, with three
 // vertices each holding a 3D position and a color.
 */
class MinimalShape extends VertexBuffer {
    constructor() {
        super("position", "color");
        // Describe the where the points of a triangle are in space, and also describe their colors:
        this.arrays.position = [vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0)];
        this.arrays.color = [color(1, 0, 0, 1), color(0, 1, 0, 1), color(0, 0, 1, 1)];
    }
}

export {MinimalShape};