import {Shader} from "./Shader.js";
import funny_vert from "./GLSL/funny_vert.glsl.js"
import funny_frag from "./GLSL/funny_frag.glsl.js"

/**
 * A simple "procedural" texture shader, with
 * texture coordinates but without an input image.
 */
class FunnyShader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        // update_GPU():  Define how to synchronize our JavaScript's variables to the GPU's:
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false, Mat.flatten_2D_to_1D(PCM.transposed()));
        context.uniform1f(gpu_addresses.animation_time, program_state.animation_time / 1000);
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return funny_vert;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        return funny_frag;
    }
}

export {FunnyShader};