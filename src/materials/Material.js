import {Container} from "../utils.js";

class Material extends Container {
    /**
     * **Material** contains messages for a shader program.  These configure the shader
     * for the particular color and style of one shape being drawn.  A material consists
     * of a pointer to the particular Shader it uses (to select that Shader for the draw
     * command), as well as a collection of any options wanted by the shader.
     * @param shader
     * @param options
     */
    constructor(shader, options) {
        super();
        Object.assign(this, {shader}, options);
    }
}

export {Material};