import {Matrix, Shader} from "../TinyGraphics.js";
import basicVert from "./GLSL/basic_vert.glsl.js";
import basicFrag from "./GLSL/basic_frag.glsl.js";

/**
 * **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
 * manages a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
 * shape's matrices and then simply samples literal colors stored at each vertex.
 */
class BasicShader extends Shader {
    /**
     * Defining how to synchronize our JavaScript's variables to the GPU's:
     * @param context
     * @param gpu_addresses
     * @param graphics_state
     * @param model_transform
     * @param material
     */
    update_GPU(context, gpu_addresses, graphics_state, model_transform, material) {
        const [P, C, M] = [graphics_state.projection_transform, graphics_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
    }

    vertex_glsl_code() {
        return basicVert;
    }

    fragment_glsl_code() {
        return basicFrag;
    }
}

export {BasicShader};
